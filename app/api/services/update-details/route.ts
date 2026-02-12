import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";

export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();
    const { number_plate, owner_contact, owner_address, color } = body;

    if (!number_plate) {
      return NextResponse.json(
        { success: false, error: "Number plate is required" },
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

    if (owner_contact) vehicle.owner_contact = owner_contact;
    if (owner_address) vehicle.owner_address = owner_address;
    if (color) vehicle.color = color;

    await vehicle.save();

    return NextResponse.json({ success: true, data: vehicle });
  } catch (err) {
    console.error("Failed to update details:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update details" },
      { status: 500 }
    );
  }
}
