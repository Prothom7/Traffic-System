import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import CreditPenalty from "@/models/creditPenaltyModel";
import User from "@/models/userModel";
import Vehicle from "@/models/vehicleModel";
import { getAuthContext, mustBeAdmin } from "@/app/api/_utils/serviceAuth";

export async function POST(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const adminError = mustBeAdmin(auth.context.isAdmin);
    if (adminError) {
      return adminError;
    }

    const now = new Date();
    const duePenalties = await CreditPenalty.find({
      status: "Active",
      expires_at: { $lte: now },
    }).lean();

    let recoveredCount = 0;

    for (const penalty of duePenalties) {
      const user = await User.findById(penalty.user_id).select("credit_score isFrozen");
      if (!user) {
        continue;
      }

      const current = Number(user.credit_score || 0);
      const next = Math.min(100, current + Number(penalty.amount_deducted || 0));
      user.credit_score = next;

      if (next > 0 && user.isFrozen) {
        user.isFrozen = false;
        user.freeze_reason = undefined;
        await Vehicle.updateMany(
          { userId: user._id, status: "Suspended" },
          { $set: { status: "Active" } }
        );
      }

      await user.save();

      await CreditPenalty.findByIdAndUpdate(penalty._id, {
        $set: { status: "Recovered", recovered_at: now },
      });

      recoveredCount += 1;
    }

    return NextResponse.json({
      success: true,
      recoveredCount,
      scannedCount: duePenalties.length,
      processedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("Credit recovery worker failed:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Credit recovery failed" },
      { status: 500 }
    );
  }
}
