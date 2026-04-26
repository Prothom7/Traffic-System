import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import StolenVehicle from "@/models/stolenVehicleModel";
import Vehicle from "@/models/vehicleModel";
import { getAuthContext, mustBeAdmin } from "@/app/api/_utils/serviceAuth";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const adminGuard = mustBeAdmin(auth.context.isAdmin);
    if (adminGuard) {
      return adminGuard;
    }

    const status = new URL(req.url).searchParams.get("status");
    const query = status ? { status } : {};

    const reports = await StolenVehicle.find(query)
      .populate("reported_by_user_id", "owner_name email")
      .populate("vehicleId", "number_plate model vehicle_type status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    console.error("Failed to fetch stolen reports for admin:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch stolen reports" },
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

    const adminGuard = mustBeAdmin(auth.context.isAdmin);
    if (adminGuard) {
      return adminGuard;
    }

    const body = await req.json();
    const {
      request_id,
      status,
    }: { request_id?: string; status?: "open" | "recovered" } = body;

    if (!request_id || !status || !["open", "recovered"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "request_id and a valid status are required" },
        { status: 400 }
      );
    }

    const report = await StolenVehicle.findById(request_id);
    if (!report) {
      return NextResponse.json({ success: false, error: "Stolen report not found" }, { status: 404 });
    }

    report.status = status;
    await report.save();

    const vehicle = await Vehicle.findById(report.vehicleId);
    if (vehicle) {
      vehicle.status = status === "recovered" ? "Active" : "Stolen";
      await vehicle.save();
    }

    return NextResponse.json({
      success: true,
      message: status === "recovered" ? "Vehicle marked as recovered" : "Report marked as open",
      data: report,
    });
  } catch (error: any) {
    console.error("Failed to update stolen report status:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update stolen report status" },
      { status: 500 }
    );
  }
}
