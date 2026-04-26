import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import VehicleReport from "@/models/vehicleReportModel";
import Vehicle from "@/models/vehicleModel";
import { getAuthContext, mustBeAdmin } from "@/app/api/_utils/serviceAuth";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const url = new URL(req.url);
    const onlyMine = url.searchParams.get("mine") === "true";

    let query: Record<string, unknown> = {};
    if (!auth.context.isAdmin || onlyMine) {
      query = { user_id: auth.context.userId };
    }

    const reports = await VehicleReport.find(query)
      .populate("vehicle_id", "number_plate chassis_number model vehicle_type status userId")
      .populate("user_id", "owner_name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch reports" },
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
    const { vehicle_id, reason } = body || {};

    if (!vehicle_id || !reason) {
      return NextResponse.json(
        { success: false, error: "vehicle_id and reason are required" },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.findOne({ _id: vehicle_id, userId: auth.context.userId });
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found or not owned by user" },
        { status: 403 }
      );
    }

    const report = await VehicleReport.create({
      user_id: auth.context.userId,
      vehicle_id: vehicle._id,
      reason: String(reason).trim(),
      status: "Pending",
    });

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create report:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create report" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const adminError = mustBeAdmin(auth.context.isAdmin);
    if (adminError) {
      return adminError;
    }

    const body = await req.json();
    const { reportId, status } = body || {};

    if (!reportId || !status) {
      return NextResponse.json(
        { success: false, error: "reportId and status are required" },
        { status: 400 }
      );
    }

    if (!["Pending", "Investigating", "Resolved"].includes(String(status))) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updated = await VehicleReport.findByIdAndUpdate(
      reportId,
      { $set: { status } },
      { new: true }
    )
      .populate("vehicle_id", "number_plate chassis_number model vehicle_type status userId")
      .populate("user_id", "owner_name email");

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Failed to update report:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update report" },
      { status: 500 }
    );
  }
}
