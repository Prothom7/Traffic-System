import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Payment from "@/models/paymentModel";

export async function POST(req: NextRequest) {
  try {
    await connect();

    const body = await req.json();
    const {
      session_token,
      result,
    }: { session_token?: string; result?: "success" | "failed" } = body;

    if (!session_token || !result || !["success", "failed"].includes(result)) {
      return NextResponse.json(
        { success: false, error: "session_token and valid result are required" },
        { status: 400 }
      );
    }

    const payment = await Payment.findOne({ gateway_session_token: session_token });
    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment session not found" }, { status: 404 });
    }

    if (payment.status === "success") {
      return NextResponse.json({ success: true, message: "Payment already successful", data: payment });
    }

    payment.gateway_provider_status = result;
    await payment.save();

    return NextResponse.json({
      success: true,
      message: `Gateway marked payment as ${result}`,
      data: {
        payment_id: String(payment._id),
        transaction_id: payment.transaction_id,
        gateway_provider_status: payment.gateway_provider_status,
      },
    });
  } catch (error: any) {
    console.error("Provider complete error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Provider completion failed" },
      { status: 500 }
    );
  }
}
