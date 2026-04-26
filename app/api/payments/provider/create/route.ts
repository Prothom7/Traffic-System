import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Payment from "@/models/paymentModel";

function randomToken(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${Date.now()}-${rand}`;
}

function authorizeInternalRequest(req: NextRequest) {
  const internalKey = process.env.PAYMENT_PROVIDER_INTERNAL_KEY || "local-dev-provider-key";
  const incoming = req.headers.get("x-provider-internal-key");
  return incoming === internalKey;
}

export async function POST(req: NextRequest) {
  try {
    await connect();

    if (!authorizeInternalRequest(req)) {
      return NextResponse.json({ success: false, error: "Unauthorized provider request" }, { status: 401 });
    }

    const body = await req.json();
    const { payment_id }: { payment_id?: string } = body;

    if (!payment_id) {
      return NextResponse.json({ success: false, error: "payment_id is required" }, { status: 400 });
    }

    const payment = await Payment.findById(payment_id);
    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "success") {
      return NextResponse.json({ success: false, error: "Payment already completed" }, { status: 409 });
    }

    const transactionId = randomToken("TXN");
    const sessionToken = randomToken("SESSION");

    payment.transaction_id = transactionId;
    payment.gateway_session_token = sessionToken;
    payment.gateway_provider_status = "initiated";
    payment.status = "pending";
    payment.gateway_reference = `GATEWAY-${sessionToken.slice(-8)}`;
    await payment.save();

    const paymentUrl = `${req.nextUrl.origin}/payments/gateway?session=${encodeURIComponent(sessionToken)}`;

    return NextResponse.json({
      success: true,
      data: {
        payment_id: String(payment._id),
        session_token: sessionToken,
        transaction_id: transactionId,
        amount: payment.amount,
        payment_url: paymentUrl,
      },
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Failed to create unique transaction/session. Retry payment initiation." },
        { status: 409 }
      );
    }

    console.error("Provider create session error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Provider failed to create session" },
      { status: 500 }
    );
  }
}
