import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
import TrafficRecord from "@/models/trafficRecordModel";
import Notification from "@/models/notificationModel";
import { eventBus } from "@/app/api/notifications/eventBus";
import Location from "@/models/locationModel";

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
      fine_amount,
    } = body || {};

    if (!number_plate || !violation_type || !cause || !camera_location) {
      return NextResponse.json(
        { error: "Number plate, violation type, cause, and camera location are required" },
        { status: 400 }
      );
    }

    const plate = String(number_plate).trim().toUpperCase();
    const vehicle = await Vehicle.findOne({
      number_plate: { $regex: `^${plate}$`, $options: "i" },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const fineAmountNumber = Number(fine_amount || 0);
    if (Number.isNaN(fineAmountNumber) || fineAmountNumber < 0) {
      return NextResponse.json({ error: "Invalid fine amount" }, { status: 400 });
    }

    const locationName = String(camera_location).trim();
    const location = locationName
      ? await Location.findOne({
          location_name: { $regex: `^${locationName}$`, $options: "i" },
        }).select("_id")
      : null;

    const record = await TrafficRecord.create({
      vehicle_id: vehicle._id,
      number_plate: plate,
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
        severity,
        fine_amount: fineAmountNumber,
        status: "Pending",
        issued_by: "Admin Simulation",
        notes: cause,
      },
    });

    const notificationsEnabled = vehicle.notifications_enabled !== false;
    let notificationPayload = null;

    if (notificationsEnabled) {
      const message = `Violation reported for ${plate}: ${violation_type} at ${locationName}.`;
      const notification = await Notification.create({
        vehicle_id: vehicle._id,
        number_plate: plate,
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
      recordId: record._id.toString(),
      notification: notificationPayload,
      notificationsEnabled,
    });
  } catch (err) {
    console.error("Simulate violation error:", err);
    return NextResponse.json({ error: "Failed to simulate violation" }, { status: 500 });
  }
}
