import { NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";

export async function GET() {
  try {
    await connect();

    const vehicles = await Vehicle.find()
      .sort({ createdAt: -1 })
      .populate("userId", "owner_name email contact");

    const formatted = vehicles.map((v) => ({
      _id: v._id,
      number_plate: v.number_plate,
      vehicle_type: v.vehicle_type,
      model: v.model,

      // 🔥 from User collection
      owner_name: v.userId?.owner_name || "N/A",
      owner_email: v.userId?.email || "N/A",
      owner_contact: v.userId?.contact || "N/A",
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}