import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import CreditPenalty from "@/models/creditPenaltyModel";
import User from "@/models/userModel";
import Vehicle from "@/models/vehicleModel";
import { getAuthContext, mustBeAdmin } from "@/app/api/_utils/serviceAuth";

async function restoreFrozenAccount(userId: string, targetCredit = 50) {
  const user = await User.findById(userId).select("credit_score isFrozen freeze_reason");
  if (!user) {
    return null;
  }

  if (!user.isFrozen && Number(user.credit_score || 0) > 0) {
    return { user, alreadyActive: true };
  }

  user.credit_score = targetCredit;
  user.isFrozen = false;
  user.freeze_reason = undefined;
  await user.save();

  await Vehicle.updateMany(
    { userId: user._id, status: "Suspended" },
    { $set: { status: "Active" } }
  );

  return { user, alreadyActive: false };
}

export async function GET(req: NextRequest) {
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

    const frozenUsers = await User.find({ isFrozen: true })
      .select("owner_name email contact credit_score freeze_reason createdAt")
      .sort({ updatedAt: -1 })
      .lean();

    const vehicles = await Vehicle.find({
      userId: { $in: frozenUsers.map((user) => user._id) },
    })
      .select("userId number_plate status")
      .lean();

    const vehicleCountMap = vehicles.reduce<Record<string, number>>((counts, vehicle) => {
      const key = String(vehicle.userId);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    return NextResponse.json({
      success: true,
      data: frozenUsers.map((user) => ({
        ...user,
        vehicle_count: vehicleCountMap[String(user._id)] || 0,
      })),
    });
  } catch (error: any) {
    console.error("Failed to fetch frozen accounts:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch frozen accounts" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { user_id }: { user_id?: string } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    const result = await restoreFrozenAccount(user_id);
    if (!result) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (result.alreadyActive) {
      return NextResponse.json(
        { success: false, error: "Account is already active" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account unfrozen and credit reset to 50",
      data: {
        user_id: String(result.user._id),
        credit_score: result.user.credit_score,
        isFrozen: result.user.isFrozen,
      },
    });
  } catch (error: any) {
    console.error("Failed to unfreeze account:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to unfreeze account" },
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
        await restoreFrozenAccount(String(user._id), next);
      } else {
        await user.save();
      }

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

