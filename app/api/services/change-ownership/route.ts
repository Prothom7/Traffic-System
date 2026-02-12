import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";

export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();
    const { number_plate, new_owner_name, new_owner_email, new_owner_contact, new_owner_address } = body;

    if (!number_plate || !new_owner_name || !new_owner_email || !new_owner_contact || !new_owner_address) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
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

    vehicle.owner_name = new_owner_name;
    vehicle.owner_email = new_owner_email;
    vehicle.owner_contact = new_owner_contact;
    vehicle.owner_address = new_owner_address;
    await vehicle.save();

    return NextResponse.json({ success: true, data: vehicle });
  } catch (err) {
    console.error("Failed to change ownership:", err);
    return NextResponse.json(
      { success: false, error: "Failed to change ownership" },
      { status: 500 }
    );
  }
}
