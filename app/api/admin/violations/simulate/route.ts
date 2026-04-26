import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
import TrafficRecord from "@/models/trafficRecordModel";
import Notification from "@/models/notificationModel";
import { eventBus } from "@/app/api/notifications/eventBus";
import Location from "@/models/locationModel";
import User from "@/models/userModel";
import StolenVehicle from "@/models/stolenVehicleModel";
import CreditPenalty from "@/models/creditPenaltyModel";

const SEVERITY_PENALTY: Record<string, number> = {
  LOW: 5,
  MEDIUM: 10,
  HIGH: 20,
  EXTREME: 40,
  CRITICAL: 40,
};

const SEVERITY_RECOVERY_DAYS: Record<string, number> = {
  LOW: 7,
  MEDIUM: 14,
  HIGH: 30,
  EXTREME: 60,
  CRITICAL: 60,
};

function normalizedSeverity(value: string | undefined): string {
  const raw = String(value || "Low").trim().toUpperCase();
  if (raw === "CRITICAL") return "EXTREME";
  if (["LOW", "MEDIUM", "HIGH", "EXTREME"].includes(raw)) return raw;
  return "LOW";
}

function defaultFineBySeverity(severity: string): number {
  switch (severity) {
    case "EXTREME":
      return 8000;
    case "HIGH":
      return 4000;
    case "MEDIUM":
      return 2000;
    default:
      return 1000;
  }
}

const BN_TO_ASCII_DIGIT: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

function toAsciiDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => BN_TO_ASCII_DIGIT[digit] || digit);
}

function normalizePlate(value: string): string {
  return toAsciiDigits(value)
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-")
    .trim();
}

function getPlateCandidates(value: string): string[] {
  const normalized = normalizePlate(value);
  const noMetro = normalized
    .replace(/\bMETRO\b|মেট্রো/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return Array.from(
    new Set([
      normalized,
      normalized.replace(/-/g, ""),
      normalized.replace(/\s+/g, ""),
      noMetro,
      noMetro.replace(/-/g, ""),
      noMetro.replace(/\s+/g, ""),
    ])
  ).filter(Boolean);
}

function canonicalPlate(value: string): string {
  return normalizePlate(value)
    .replace(/\bMETRO\b|মেট্রো/gi, " ")
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req: NextRequest) {
  try {
    await connect();

    const body = await req.json();
    const {
      number_plate,
      violation_type,
      cause,
      camera_location,
      severity,
      speed,
      image_url,
    } = body || {};

    if (!number_plate || !violation_type || !cause || !camera_location) {
      return NextResponse.json(
        { error: "Number plate, violation type, cause, and camera location are required" },
        { status: 400 }
      );
    }

    const plate = String(number_plate || "").trim();
    const normalizedCandidates = getPlateCandidates(plate);

    const plateMatcher = normalizedCandidates.map((candidate) => ({
      number_plate: { $regex: `^${escapeRegExp(candidate)}$`, $options: "i" },
    }));

    let vehicle = await Vehicle.findOne({
      $or: plateMatcher,
    }).populate("userId", "owner_name contact email credit_score isFrozen");

    if (!vehicle) {
      const allVehicles = await Vehicle.find({}, "number_plate userId").populate(
        "userId",
        "owner_name contact email credit_score isFrozen"
      );
      const targetCanonical = canonicalPlate(plate);

      vehicle =
        allVehicles.find((item) => canonicalPlate(String(item.number_plate || "")) === targetCanonical) ||
        null;
    }

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const populatedOwner =
      vehicle.userId && typeof vehicle.userId === "object" && "_id" in vehicle.userId
        ? (vehicle.userId as any)
        : null;

    const user = populatedOwner || (await User.findById(vehicle.userId).select("owner_name contact email credit_score isFrozen"));
    if (!user) {
      return NextResponse.json({ error: "Owner not found for vehicle" }, { status: 404 });
    }

    const ownerId = String(user._id);

    const locationName = String(camera_location).trim();
    const location = locationName
      ? await Location.findOne({
          location_name: { $regex: `^${locationName}$`, $options: "i" },
        }).select("_id location_name latitude longitude")
      : null;

    const persistedPlate = normalizePlate(String(vehicle.number_plate || plate));

    const stolenMatch = await StolenVehicle.findOne({
      $or: [
        { vehicle_id: vehicle._id },
        { vehicleId: vehicle._id },
        { number_plate: persistedPlate },
        { chassis_number: vehicle.chassis_number },
      ],
      status: { $in: ["Stolen", "open"] },
    });

    if (stolenMatch) {
      const now = new Date();
      stolenMatch.last_seen_location = locationName;
      stolenMatch.last_seen_time = now;
      if (stolenMatch.status === "open") {
        stolenMatch.status = "Stolen";
      }
      await stolenMatch.save();

      const speedNumber = Number(speed);
      const captureRecord = await TrafficRecord.create({
        vehicle_id: vehicle._id,
        user_id: user._id,
        number_plate: persistedPlate,
        location_id: location?._id,
        location: location
          ? {
              location_name: location.location_name,
              latitude: location.latitude,
              longitude: location.longitude,
            }
          : {
              location_name: locationName,
            },
        timestamp: now,
        speed: Number.isFinite(speedNumber) ? speedNumber : undefined,
        image_url: typeof image_url === "string" ? image_url : undefined,
      });

      const stolenAlertMessage = `High-priority alert: stolen vehicle ${persistedPlate} detected at ${locationName}.`;
      const stolenNotification = await Notification.create({
        vehicle_id: vehicle._id,
        number_plate: persistedPlate,
        violation_type: "Stolen Vehicle Detection",
        cause: cause || "Automated camera match",
        camera_location: locationName,
        message: stolenAlertMessage,
      });

      const notificationPayload = {
        _id: stolenNotification._id.toString(),
        number_plate: stolenNotification.number_plate,
        violation_type: stolenNotification.violation_type,
        cause: stolenNotification.cause,
        camera_location: stolenNotification.camera_location,
        message: stolenNotification.message,
        createdAt: stolenNotification.createdAt.toISOString(),
      };

      eventBus.emit("violation", {
        vehicleId: vehicle._id.toString(),
        notification: notificationPayload,
      });

      eventBus.emit("traffic-record-created", {
        userId: String(user._id),
        recordId: captureRecord._id.toString(),
        number_plate: persistedPlate,
        timestamp: now.toISOString(),
      });

      eventBus.emit("stolen-vehicle-detected", {
        userId: String(user._id),
        vehicleId: vehicle._id.toString(),
        number_plate: persistedPlate,
        location: locationName,
        timestamp: now.toISOString(),
      });

      return NextResponse.json({
        success: true,
        pipelineAction: "stolen-alert",
        recordId: captureRecord._id.toString(),
        owner: {
          user_id: ownerId,
          owner_name: String(user.owner_name || ""),
          contact: String(user.contact || ""),
          email: String(user.email || ""),
        },
        notification: notificationPayload,
        stolenMatch: {
          number_plate: persistedPlate,
          status: String(stolenMatch.status),
          last_seen_location: String(stolenMatch.last_seen_location || locationName),
          last_seen_time: new Date(stolenMatch.last_seen_time || now).toISOString(),
        },
      });
    }

    const severityKey = normalizedSeverity(severity);
    const resolvedFineAmount = defaultFineBySeverity(severityKey);
    const penaltyAmount = SEVERITY_PENALTY[severityKey] || 5;
    const recoveryDays = SEVERITY_RECOVERY_DAYS[severityKey] || 7;
    const penaltyExpiresAt = new Date(Date.now() + recoveryDays * 24 * 60 * 60 * 1000);

    const nextScore = Math.max(0, Number(user.credit_score || 100) - penaltyAmount);
    const shouldFreeze = nextScore <= 0;

    user.credit_score = nextScore;
    if (shouldFreeze) {
      user.isFrozen = true;
      user.freeze_reason = "Credit score reached zero due to repeated traffic violations";
      await Vehicle.updateMany(
        { userId: ownerId, status: { $ne: "Stolen" } },
        { $set: { status: "Suspended" } }
      );
    }
    await user.save();

    const penaltyLog = await CreditPenalty.create({
      user_id: user._id,
      vehicle_id: vehicle._id,
      traffic_record_number_plate: normalizePlate(String(vehicle.number_plate || plate)),
      severity: severityKey,
      reason: `${violation_type} at ${String(camera_location || "Unknown location")}`,
      amount_deducted: penaltyAmount,
      expires_at: penaltyExpiresAt,
      status: "Active",
    });

    const record = await TrafficRecord.create({
      vehicle_id: vehicle._id,
      user_id: user._id,
      number_plate: persistedPlate,
      location_id: location?._id,
      location: location
        ? {
            location_name: location.location_name,
            latitude: location.latitude,
            longitude: location.longitude,
          }
        : {
            location_name: locationName,
          },
      timestamp: new Date(),
      violation: {
        type: violation_type,
        severity: severityKey,
        fine_amount: resolvedFineAmount,
        status: "Pending",
        issued_by: "Admin Simulation",
        notes: cause,
      },
      credit_penalty: penaltyAmount,
    });

    eventBus.emit("traffic-record-created", {
      userId: String(user._id),
      recordId: record._id.toString(),
      number_plate: persistedPlate,
      timestamp: new Date().toISOString(),
    });

    const notificationsEnabled = vehicle.notifications_enabled !== false;
    let notificationPayload = null;

    if (notificationsEnabled) {
      const message = `Violation reported for ${persistedPlate}: ${violation_type} at ${locationName}. Fine: ${resolvedFineAmount}.`;
      const notification = await Notification.create({
        vehicle_id: vehicle._id,
        number_plate: persistedPlate,
        violation_type,
        cause,
        camera_location: locationName,
        message,
      });

      notificationPayload = {
        _id: notification._id.toString(),
        number_plate: notification.number_plate,
        violation_type: notification.violation_type,
        cause: notification.cause,
        camera_location: notification.camera_location,
        message: notification.message,
        createdAt: notification.createdAt.toISOString(),
      };

      eventBus.emit("violation", {
        vehicleId: vehicle._id.toString(),
        notification: notificationPayload,
      });
    }

    return NextResponse.json({
      success: true,
      pipelineAction: "violation-created",
      recordId: record._id.toString(),
      owner: {
        user_id: ownerId,
        owner_name: String(user.owner_name || ""),
        contact: String(user.contact || ""),
        email: String(user.email || ""),
      },
      notification: notificationPayload,
      notificationsEnabled,
      penalty: {
        amount: penaltyAmount,
        credit_score_after: nextScore,
        recovery_days: recoveryDays,
        penalty_log_id: penaltyLog._id.toString(),
      },
      accountFrozen: shouldFreeze,
      stolenMatch: null,
    });
  } catch (err) {
    console.error("Simulate violation error:", err);
    return NextResponse.json({ error: "Failed to simulate violation" }, { status: 500 });
  }
}
