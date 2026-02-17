import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";

export async function GET(req: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const number_plate = searchParams.get("number_plate");

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

    return NextResponse.json({ success: true, data: vehicle });
  } catch (err) {
    console.error("Failed to check vehicle status:", err);
    return NextResponse.json(
      { success: false, error: "Failed to check vehicle status" },
      { status: 500 }
    );
  }
}
