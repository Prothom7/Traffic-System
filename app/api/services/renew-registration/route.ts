import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
import RenewalRequest from "@/models/renewalRequestModel";
import { getAuthContext } from "@/app/api/_utils/serviceAuth";
import {
  computeRenewedExpiry,
  getNextRequestNumber,
  isRenewalWindowValid,
  monthsRemaining,
  normalizePlate,
} from "@/app/api/_utils/serviceRules";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const requests = await RenewalRequest.find({ userId: auth.context.userId })
      .populate("vehicleId", "number_plate model vehicle_type registration_expiry")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error("Failed to fetch renewal requests:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch renewal requests" },
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
    const { number_plate } = body;

    if (!number_plate) {
      return NextResponse.json(
        { success: false, error: "Number plate is required" },
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

    const expiryDate = new Date(vehicle.registration_expiry);
    const isEligible = isRenewalWindowValid(expiryDate);
    if (!isEligible) {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle is not eligible. Renewal is allowed only when less than 90 days remain.",
        },
        { status: 400 }
      );
    }

    const existingPending = await RenewalRequest.findOne({
      userId: auth.context.userId,
      vehicleId: vehicle._id,
      status: "pending",
    });

    if (existingPending) {
      return NextResponse.json(
        { success: false, error: "A pending renewal request already exists for this vehicle" },
        { status: 409 }
      );
    }

    const requestNumber = await getNextRequestNumber(RenewalRequest);
    const renewalRequest = await RenewalRequest.create({
      request_number: requestNumber,
      userId: auth.context.userId,
      vehicleId: vehicle._id,
      status: "pending",
      months_remaining_at_request: Number(monthsRemaining(expiryDate).toFixed(2)),
      current_registration_expiry: expiryDate,
      requested_registration_expiry: computeRenewedExpiry(expiryDate),
      payment_required: true,
      payment_status: "not_required",
    });

    return NextResponse.json({
      success: true,
      message: "Renewal request submitted and pending admin approval",
      data: renewalRequest,
    });
  } catch (err) {
    console.error("Failed to renew registration:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create renewal request" },
      { status: 500 }
    );
  }
}