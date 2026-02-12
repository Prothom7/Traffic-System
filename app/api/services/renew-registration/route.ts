import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";

export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();
    const { number_plate, registration_expiry } = body;

    if (!number_plate || !registration_expiry) {
      return NextResponse.json(
        { success: false, error: "Number plate and registration expiry are required" },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.findOne({ number_plate: number_plate.toUpperCase() });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found" },
        { status: 404 }
      );
    }

    vehicle.registration_expiry = new Date(registration_expiry);
    vehicle.status = "Active";
    await vehicle.save();

    return NextResponse.json({ success: true, data: vehicle });
  } catch (err) {
    console.error("Failed to renew registration:", err);
    return NextResponse.json(
      { success: false, error: "Failed to renew registration" },
      { status: 500 }
    );
  }
}
