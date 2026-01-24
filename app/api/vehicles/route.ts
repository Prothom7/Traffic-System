import { NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";

export async function GET() {
  try {
    await connect(); // must call your connect function
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}
