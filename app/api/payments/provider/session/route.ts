import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Payment from "@/models/paymentModel";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const sessionToken = new URL(req.url).searchParams.get("session_token");
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "session_token is required" }, { status: 400 });
    }

    const payment = await Payment.findOne({ gateway_session_token: sessionToken })
      .populate("vehicle_id", "number_plate model")
      .lean();

    if (!payment) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        payment_id: String(payment._id),
        amount: payment.amount,
        transaction_id: payment.transaction_id,
        provider_status: payment.gateway_provider_status,
        status: payment.status,
        vehicle: payment.vehicle_id,
      },
    });
  } catch (error: any) {
    console.error("Provider session fetch error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch payment session" },
      { status: 500 }
    );
  }
}
