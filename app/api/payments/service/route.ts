import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Payment from "@/models/paymentModel";
import RenewalRequest from "@/models/renewalRequestModel";
import Vehicle from "@/models/vehicleModel";
import { getAuthContext } from "@/app/api/_utils/serviceAuth";

function gatewayReference(paymentId: string) {
  const suffix = paymentId.slice(-6).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SRV-${suffix}-${Date.now()}-${rand}`;
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
      payment_id,
      payment_method,
      simulate_failure,
    }: { payment_id?: string; payment_method?: string; simulate_failure?: boolean } = body;

    if (!payment_id) {
      return NextResponse.json({ success: false, error: "payment_id is required" }, { status: 400 });
    }

    const session = await mongoose.startSession();
    let response: NextResponse | null = null;

    await session.withTransaction(async () => {
      const payment = await Payment.findById(payment_id).session(session);
      if (!payment) {
        response = NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
        return;
      }

      if (!auth.context?.isAdmin && String(payment.user_id) !== auth.context?.userId) {
        response = NextResponse.json(
          { success: false, error: "You can only pay your own renewal request" },
          { status: 403 }
        );
        return;
      }

      if (payment.status === "success") {
        response = NextResponse.json(
          { success: false, error: "Payment is already completed" },
          { status: 409 }
        );
        return;
      }

      const renewalRequest = await RenewalRequest.findById(payment.request_id).session(session);
      if (!renewalRequest) {
        response = NextResponse.json(
          { success: false, error: "Linked renewal request not found for this payment" },
          { status: 422 }
        );
        return;
      }

      if (renewalRequest.status !== "approved") {
        response = NextResponse.json(
          { success: false, error: "Payment is only allowed after admin approval" },
          { status: 400 }
        );
        return;
      }

      if (simulate_failure) {
        payment.status = "failed";
        payment.payment_method = payment_method || payment.payment_method;
        await payment.save({ session });

        renewalRequest.payment_status = "failed";
        await renewalRequest.save({ session });

        response = NextResponse.json({ success: true, message: "Payment failed (simulated)", data: payment });
        return;
      }

      const vehicle = await Vehicle.findById(payment.vehicle_id).session(session);
      if (!vehicle) {
        response = NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
        return;
      }

      payment.status = "success";
      payment.payment_method = payment_method || payment.payment_method;
      payment.gateway_reference = gatewayReference(String(payment._id));
      payment.paid_at = new Date();
      await payment.save({ session });

      renewalRequest.payment_status = "success";
      await renewalRequest.save({ session });

      vehicle.registration_expiry = new Date(renewalRequest.requested_registration_expiry);
      vehicle.status = "Active";
      await vehicle.save({ session });

      response = NextResponse.json({
        success: true,
        message: "Payment completed and registration has been renewed",
        data: {
          payment,
          renewal_request_id: renewalRequest._id,
          vehicle_id: vehicle._id,
          new_registration_expiry: vehicle.registration_expiry,
        },
      });
    });

    await session.endSession();

    if (response) {
      return response;
    }

    return NextResponse.json({ success: false, error: "Unable to complete payment" }, { status: 500 });
  } catch (error: any) {
    console.error("Service payment failed:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Service payment failed" },
      { status: 500 }
    );
  }
}
