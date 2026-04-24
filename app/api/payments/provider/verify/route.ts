import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Payment from "@/models/paymentModel";

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
    const { transaction_id }: { transaction_id?: string } = body;

    if (!transaction_id) {
      return NextResponse.json({ success: false, error: "transaction_id is required" }, { status: 400 });
    }

    const payment = await Payment.findOne({ transaction_id }).lean();
    if (!payment) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction_id,
        payment_id: String(payment._id),
        provider_status: payment.gateway_provider_status,
      },
    });
  } catch (error: any) {
    console.error("Provider verify error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Provider verification failed" },
      { status: 500 }
    );
  }
}
