import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import RenewalRequest from "@/models/renewalRequestModel";
import Payment from "@/models/paymentModel";
import { getAuthContext } from "@/app/api/_utils/serviceAuth";

const DEFAULT_RENEWAL_FEE = 1500;

export async function POST(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const body = await req.json();
    const {
      request_id,
      amount,
    }: { request_id?: string; amount?: number } = body;

    if (!request_id) {
      return NextResponse.json({ success: false, error: "request_id is required" }, { status: 400 });
    }

    const renewalRequest = await RenewalRequest.findById(request_id);
    if (!renewalRequest) {
      return NextResponse.json({ success: false, error: "Renewal request not found" }, { status: 404 });
    }

    if (!auth.context.isAdmin && String(renewalRequest.userId) !== auth.context.userId) {
      return NextResponse.json(
        { success: false, error: "You can only initiate payment for your own request" },
        { status: 403 }
      );
    }

    if (renewalRequest.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Payment can only be initiated for approved renewal requests" },
        { status: 400 }
      );
    }

    let payment = await Payment.findOne({ request_type: "renewal", request_id: renewalRequest._id });

    if (payment?.status === "success") {
      return NextResponse.json(
        { success: false, error: "Payment is already completed for this renewal request" },
        { status: 409 }
      );
    }

    if (!payment) {
      payment = await Payment.create({
        user_id: renewalRequest.userId,
        vehicle_id: renewalRequest.vehicleId,
        request_type: "renewal",
        request_id: renewalRequest._id,
        request_model: "RenewalRequest",
        amount: typeof amount === "number" && amount > 0 ? amount : DEFAULT_RENEWAL_FEE,
        status: "pending",
      });
    } else {
      payment.status = "pending";
      payment.gateway_provider_status = "initiated";
      if (typeof amount === "number" && amount > 0) {
        payment.amount = amount;
      }
      await payment.save();
    }

    const providerResponse = await fetch(`${req.nextUrl.origin}/api/payments/provider/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-provider-internal-key": process.env.PAYMENT_PROVIDER_INTERNAL_KEY || "local-dev-provider-key",
      },
      body: JSON.stringify({ payment_id: String(payment._id) }),
    });

    const providerData = await providerResponse.json();
    if (!providerResponse.ok || !providerData?.success) {
      return NextResponse.json(
        { success: false, error: providerData?.error || "Failed to create payment session" },
        { status: providerResponse.status || 500 }
      );
    }

    renewalRequest.payment_status = "pending";
    await renewalRequest.save();

    return NextResponse.json({
      success: true,
      message: "Payment session created. Redirect to gateway to continue.",
      data: {
        payment_id: String(payment._id),
        request_id: String(renewalRequest._id),
        amount: payment.amount,
        transaction_id: providerData.data.transaction_id,
        payment_url: providerData.data.payment_url,
      },
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      const existing = await Payment.findOne({ request_type: "renewal", request_id: error?.keyValue?.request_id });
      return NextResponse.json({ success: true, message: "Payment already exists", data: existing });
    }

    console.error("Payment initiation failed:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Payment initiation failed" },
      { status: 500 }
    );
  }
}
