import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import OwnershipChangeRequest from "@/models/ownershipChangeRequestModel";
import User from "@/models/userModel";
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

    const requests = await OwnershipChangeRequest.find(query)
      .populate("userId", "owner_name email")
      .populate("vehicleId", "number_plate model vehicle_type")
      .populate("new_owner_user_id", "owner_name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error("Failed to fetch ownership requests:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch ownership requests" },
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
      admin_note,
    }: { request_id?: string; status?: "approved" | "rejected"; admin_note?: string } = body;

    if (!request_id || !status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "request_id and a valid status are required" },
        { status: 400 }
      );
    }

    const request = await OwnershipChangeRequest.findById(request_id);
    if (!request) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Only pending requests can be updated" },
        { status: 409 }
      );
    }

    request.status = status;
    request.adminId = auth.context.userId;
    request.admin_note = admin_note;
    request.decided_at = new Date();

    if (status === "rejected") {
      await request.save();
      return NextResponse.json({
        success: true,
        message: "Ownership request rejected",
        data: request,
      });
    }

    let newOwnerId = request.new_owner_user_id;
    if (!newOwnerId && request.new_owner_email) {
      const foundOwner = await User.findOne({ email: request.new_owner_email.toLowerCase() }).select("_id");
      if (foundOwner) {
        newOwnerId = foundOwner._id;
        request.new_owner_user_id = foundOwner._id;
      }
    }

    if (!newOwnerId) {
      return NextResponse.json(
        {
          success: false,
          error: "New owner must have a registered account before approval can transfer ownership",
        },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.findById(request.vehicleId);
    if (!vehicle) {
      return NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
    }

    vehicle.userId = newOwnerId;
    await vehicle.save();

    request.transferred_at = new Date();
    await request.save();

    return NextResponse.json({
      success: true,
      message: "Ownership request approved and vehicle ownership transferred",
      data: request,
    });
  } catch (error: any) {
    console.error("Failed to update ownership request:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update ownership request" },
      { status: 500 }
    );
  }
}
