import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
import User from "@/models/userModel";
import OwnershipChangeRequest from "@/models/ownershipChangeRequestModel";
import { getAuthContext } from "@/app/api/_utils/serviceAuth";
import { getNextRequestNumber, normalizePlate } from "@/app/api/_utils/serviceRules";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const requests = await OwnershipChangeRequest.find({ userId: auth.context.userId })
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
      new_owner_name,
      new_owner_email,
      new_owner_contact,
      new_owner_address,
    } = body;

    if (!number_plate || !new_owner_email) {
      return NextResponse.json(
        { success: false, error: "Number plate and new owner email are required" },
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

    const existingPending = await OwnershipChangeRequest.findOne({
      userId: auth.context.userId,
      vehicleId: vehicle._id,
      status: "pending",
    });

    if (existingPending) {
      return NextResponse.json(
        { success: false, error: "A pending ownership request already exists for this vehicle" },
        { status: 409 }
      );
    }

    const requestNumber = await getNextRequestNumber(OwnershipChangeRequest);
    const newOwner = await User.findOne({ email: new_owner_email.toLowerCase() });

    const request = await OwnershipChangeRequest.create({
      request_number: requestNumber,
      userId: auth.context.userId,
      vehicleId: vehicle._id,
      status: "pending",
      new_owner_user_id: newOwner?._id,
      new_owner_name,
      new_owner_email: new_owner_email.toLowerCase(),
      new_owner_contact,
      new_owner_address,
    });

    return NextResponse.json({
      success: true,
      message: "Ownership change request submitted and pending admin approval",
      data: request,
    });
  } catch (err) {
    console.error("Failed to change ownership:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create ownership change request" },
      { status: 500 }
    );
  }
}
