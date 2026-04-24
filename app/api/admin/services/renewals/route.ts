import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import RenewalRequest from "@/models/renewalRequestModel";
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

    const requests = await RenewalRequest.find(query)
      .populate("userId", "owner_name email")
      .populate("vehicleId", "number_plate model vehicle_type registration_expiry")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error("Failed to fetch admin renewal requests:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch renewal requests" },
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
      amount,
    }: { request_id?: string; status?: "approved" | "rejected"; admin_note?: string; amount?: number } = body;

    if (!request_id || !status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "request_id and a valid status are required" },
        { status: 400 }
      );
    }

    const renewalRequest = await RenewalRequest.findById(request_id);
    if (!renewalRequest) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    if (renewalRequest.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Only pending requests can be updated" },
        { status: 409 }
      );
    }

    renewalRequest.status = status;
    renewalRequest.adminId = auth.context.userId;
    renewalRequest.admin_note = admin_note;
    renewalRequest.decided_at = new Date();

    if (status === "rejected") {
      renewalRequest.payment_status = "not_required";
      await renewalRequest.save();

      return NextResponse.json({
        success: true,
        message: "Renewal request rejected",
        data: renewalRequest,
      });
    }

    renewalRequest.payment_status = "pending";
    await renewalRequest.save();

    return NextResponse.json({
      success: true,
      message: "Renewal approved. User can now initiate payment.",
      data: {
        request: renewalRequest,
        amount: typeof amount === "number" && amount > 0 ? amount : undefined,
      },
    });
  } catch (error: any) {
    console.error("Failed to update renewal request:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update renewal request" },
      { status: 500 }
    );
  }
}
