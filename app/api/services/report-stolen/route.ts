import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
import StolenVehicle from "@/models/stolenVehicleModel";
import { getAuthContext } from "@/app/api/_utils/serviceAuth";
import { normalizePlate } from "@/app/api/_utils/serviceRules";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const { searchParams } = new URL(req.url);
    const includeAll = searchParams.get("all") === "true";

    const query =
      includeAll && auth.context.isAdmin
        ? {}
        : { reported_by_user_id: auth.context.userId };

    const reports = await StolenVehicle.find(query)
      .populate("vehicleId", "number_plate model vehicle_type status userId")
      .populate("reported_by_user_id", "owner_name email")
      .sort({ createdAt: -1 })
      .lean();

    const filteredReports = reports.filter((report: any) => {
      const hasOwner = Boolean(
        report?.reported_by_user_id?._id || report?.reported_by_user_id,
      );
      const hasVehicle = Boolean(report?.vehicleId?._id);
      const linkedOwnerVehicle =
        hasOwner &&
        hasVehicle &&
        String(report.vehicleId.userId || "") ===
          String(report.reported_by_user_id._id || report.reported_by_user_id);

      return hasOwner && hasVehicle && linkedOwnerVehicle;
    });

    return NextResponse.json({ success: true, data: filteredReports });
  } catch (error: any) {
    console.error("Failed to fetch stolen reports:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch stolen reports",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const body = await req.json();
    const {
      number_plate,
      incident_date,
      incident_location,
      police_report_number,
      additional_info,
    } = body;

    if (!number_plate || !incident_date || !incident_location) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Number plate, incident date and incident location are required",
        },
        { status: 400 },
      );
    }

    const vehicle = await Vehicle.findOne({
      userId: auth.context.userId,
      number_plate: normalizePlate(number_plate),
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found or not owned by user" },
        { status: 403 },
      );
    }

    const existing = await StolenVehicle.findOne({
      vehicleId: vehicle._id,
      status: { $in: ["Stolen", "open"] },
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "This vehicle already has an active stolen report",
        },
        { status: 409 },
      );
    }

    const stolenRecord = await StolenVehicle.create({
      vehicle_id: vehicle._id,
      vehicleId: vehicle._id,
      number_plate: normalizePlate(number_plate),
      chassis_number: vehicle.chassis_number,
      reported_by_user_id: auth.context.userId,
      incident_date: new Date(incident_date),
      incident_location,
      last_seen_location: incident_location,
      last_seen_time: new Date(incident_date),
      police_report_number,
      additional_info,
      status: "Stolen",
    });

    vehicle.status = "Stolen";
    await vehicle.save();

    return NextResponse.json({
      success: true,
      message: "Vehicle marked as stolen",
      data: { vehicle, stolenRecord },
    });
  } catch (err) {
    console.error("Failed to report stolen vehicle:", err);
    return NextResponse.json(
      { success: false, error: "Failed to report stolen vehicle" },
      { status: 500 },
    );
  }
}
