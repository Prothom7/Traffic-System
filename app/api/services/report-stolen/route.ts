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

    const reports = await StolenVehicle.find({ reported_by_user_id: auth.context.userId })
      .populate("vehicleId", "number_plate model vehicle_type status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    console.error("Failed to fetch stolen reports:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch stolen reports" },
      { status: 500 }
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
        { success: false, error: "Number plate, incident date and incident location are required" },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.findOne({
      userId: auth.context.userId,
      number_plate: normalizePlate(number_plate),
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found or not owned by user" },
        { status: 403 }
      );
    }

    const existing = await StolenVehicle.findOne({ vehicleId: vehicle._id });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "This vehicle has already been reported as stolen" },
        { status: 409 }
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
      { status: 500 }
    );
  }
}