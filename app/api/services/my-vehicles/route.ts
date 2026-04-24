import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
import { getAuthContext } from "@/app/api/_utils/serviceAuth";
import { monthsRemaining, isRenewalWindowValid, daysRemaining } from "@/app/api/_utils/serviceRules";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const vehicles = await Vehicle.find({ userId: auth.context.userId })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = vehicles.map((vehicle: any) => {
      const expiry = new Date(vehicle.registration_expiry);
      const monthsLeft = monthsRemaining(expiry);
      const daysLeft = daysRemaining(expiry);
      const eligibleForRenewal = isRenewalWindowValid(expiry);

      return {
        _id: String(vehicle._id),
        number_plate: vehicle.number_plate,
        model: vehicle.model,
        vehicle_type: vehicle.vehicle_type,
        status: vehicle.status,
        registration_expiry: vehicle.registration_expiry,
        months_remaining: Number(monthsLeft.toFixed(2)),
        days_remaining: Number(daysLeft.toFixed(0)),
        eligible_for_renewal: eligibleForRenewal,
        renewal_message: eligibleForRenewal
          ? "Eligible for renewal"
          : "Renewal allowed only when less than 90 days remain",
      };
    });

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error("Failed to fetch user vehicles:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}
