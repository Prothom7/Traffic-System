import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Payment from "@/models/paymentModel";
import RenewalRequest from "@/models/renewalRequestModel";
import Vehicle from "@/models/vehicleModel";
import { getAuthContext } from "@/app/api/_utils/serviceAuth";

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
      transaction_id,
      payment_method,
    }: { payment_id?: string; transaction_id?: string; payment_method?: string } = body;

    if (!payment_id || !transaction_id) {
      return NextResponse.json(
        { success: false, error: "payment_id and transaction_id are required" },
        { status: 400 }
      );
    }

    const payment = await Payment.findById(payment_id);
    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    if (!auth.context.isAdmin && String(payment.user_id) !== auth.context.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (payment.status === "success") {
      return NextResponse.json({ success: true, message: "Payment already verified", data: payment });
    }

    if (payment.transaction_id !== transaction_id) {
      return NextResponse.json({ success: false, error: "Transaction ID mismatch" }, { status: 400 });
    }

    const providerResponse = await fetch(`${req.nextUrl.origin}/api/payments/provider/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-provider-internal-key": process.env.PAYMENT_PROVIDER_INTERNAL_KEY || "local-dev-provider-key",
      },
      body: JSON.stringify({ transaction_id }),
    });

    const providerData = await providerResponse.json();
    if (!providerResponse.ok || !providerData?.success) {
      return NextResponse.json(
        { success: false, error: providerData?.error || "Unable to verify transaction" },
        { status: providerResponse.status || 500 }
      );
    }

    const providerStatus = providerData.data.provider_status;
    const session = await mongoose.startSession();
    let apiResponse: NextResponse | null = null;

    await session.withTransaction(async () => {
      const dbPayment = await Payment.findById(payment_id).session(session);
      if (!dbPayment) {
        apiResponse = NextResponse.json({ success: false, error: "Payment no longer exists" }, { status: 404 });
        return;
      }

      const renewalRequest = await RenewalRequest.findById(dbPayment.request_id).session(session);
      if (!renewalRequest) {
        apiResponse = NextResponse.json({ success: false, error: "Linked renewal request not found" }, { status: 422 });
        return;
      }

      if (renewalRequest.status !== "approved") {
        apiResponse = NextResponse.json(
          { success: false, error: "Renewal request is not approved for payment" },
          { status: 400 }
        );
        return;
      }

      if (providerStatus === "success") {
        const vehicle = await Vehicle.findById(dbPayment.vehicle_id).session(session);
        if (!vehicle) {
          apiResponse = NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
          return;
        }

        dbPayment.status = "success";
        dbPayment.gateway_provider_status = "success";
        dbPayment.payment_method = payment_method || dbPayment.payment_method;
        dbPayment.paid_at = new Date();
        await dbPayment.save({ session });

        renewalRequest.payment_status = "success";
        await renewalRequest.save({ session });

        vehicle.registration_expiry = new Date(renewalRequest.requested_registration_expiry);
        vehicle.status = "Active";
        await vehicle.save({ session });

        apiResponse = NextResponse.json({
          success: true,
          message: "Payment verified and registration updated",
          data: {
            payment_id: String(dbPayment._id),
            transaction_id,
            new_registration_expiry: vehicle.registration_expiry,
          },
        });
        return;
      }

      if (providerStatus === "failed") {
        dbPayment.status = "failed";
        dbPayment.gateway_provider_status = "failed";
        dbPayment.payment_method = payment_method || dbPayment.payment_method;
        await dbPayment.save({ session });

        renewalRequest.payment_status = "failed";
        await renewalRequest.save({ session });

        apiResponse = NextResponse.json(
          { success: false, error: "Payment failed at provider" },
          { status: 402 }
        );
        return;
      }

      apiResponse = NextResponse.json(
        { success: false, error: "Payment is still pending at provider" },
        { status: 202 }
      );
    });

    await session.endSession();
    if (apiResponse) {
      return apiResponse;
    }

    return NextResponse.json({ success: false, error: "Unexpected verification failure" }, { status: 500 });
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
