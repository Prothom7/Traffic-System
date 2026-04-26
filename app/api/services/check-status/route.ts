import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
import { getAuthContext } from "@/app/api/_utils/serviceAuth";
import { normalizePlate } from "@/app/api/_utils/serviceRules";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const { searchParams } = new URL(req.url);
    const number_plate = searchParams.get("number_plate");

    if (!number_plate) {
      return NextResponse.json(
        { success: false, error: "Number plate is required" },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.findOne({
      userId: auth.context.userId,
      number_plate: normalizePlate(number_plate),
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found or not owned by user" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: vehicle });
  } catch (err) {
    console.error("Failed to check vehicle status:", err);
    return NextResponse.json(
      { success: false, error: "Failed to check vehicle status" },
      { status: 500 }
    );
  }
}
