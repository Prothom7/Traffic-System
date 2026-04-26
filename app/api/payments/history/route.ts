import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Payment from "@/models/paymentModel";
import { getAuthContext } from "@/app/api/_utils/serviceAuth";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const includeAll = new URL(req.url).searchParams.get("all") === "true";
    const canViewAll = includeAll && auth.context.isAdmin;

    const query = canViewAll ? {} : { user_id: auth.context.userId };

    const payments = await Payment.find(query)
      .populate("user_id", "owner_name email")
      .populate("vehicle_id", "number_plate model")
      .populate("request_id")
      .sort({ createdAt: -1 })
      .lean();

    const cleaned = payments
      .filter((payment: any) => Boolean(payment.request_id))
      .map((payment: any) => ({
        _id: String(payment._id),
        user: payment.user_id,
        vehicle: payment.vehicle_id,
        request: payment.request_id,
        request_type: payment.request_type,
        amount: payment.amount,
        status: payment.status,
        payment_method: payment.payment_method,
        gateway_reference: payment.gateway_reference,
        paid_at: payment.paid_at,
        createdAt: payment.createdAt,
      }));

    return NextResponse.json({ success: true, data: cleaned, total: cleaned.length });
  } catch (error: any) {
    console.error("Failed to fetch payment history:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}
