import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
import User from "@/models/userModel";
import { getAuthContext } from "@/app/api/_utils/serviceAuth";
import { normalizePlate } from "@/app/api/_utils/serviceRules";

export async function POST(req: NextRequest) {
  try {
    await connect();

    const auth = await getAuthContext(req);
    if (auth.error || !auth.context) {
      return auth.error!;
    }

    const body = await req.json();
    const { number_plate, color, contact, address } = body;

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

    // Update vehicle details
    if (color) vehicle.color = color;
    await vehicle.save();

    // Update user contact and address
    const user = await User.findById(auth.context.userId);
    if (user) {
      if (contact) user.contact = contact;
      if (address) user.address = address;
      await user.save();
    }

    return NextResponse.json({ success: true, data: { vehicle, user } });
  } catch (err) {
    console.error("Failed to update details:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update details" },
      { status: 500 }
    );
  }

}