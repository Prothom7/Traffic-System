import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import { decodeJWTToken } from "@/helpers/jwtToken";

export async function POST(request: NextRequest) {
  try {
    await connect();

    // Get token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = decodeJWTToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Verify user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();

    const {
      number_plate,
      chassis_number,
      vehicle_type,
      model,
      color,
      year_of_manufacture,
      engine_type,
      registration_expiry,
    } = body;

    if (
      !number_plate ||
      !chassis_number ||
      !vehicle_type ||
      !model ||
      !color ||
      !year_of_manufacture ||
      !engine_type ||
      !registration_expiry
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const yearNum = Number(year_of_manufacture);
    const regDate = new Date(registration_expiry);
    if (isNaN(yearNum) || !regDate.getTime()) {
      return NextResponse.json({ error: "Invalid year or registration date" }, { status: 400 });
    }

    // Check if vehicle already exists
    const existing = await Vehicle.findOne({
      $or: [{ number_plate }, { chassis_number }],
    });
    if (existing) {
      return NextResponse.json({ error: "Vehicle with this number plate or chassis number already exists" }, { status: 400 });
    }

    const maxVehicle = await Vehicle.findOne().sort({ vehicle_id: -1 });
    const nextVehicleId = maxVehicle ? maxVehicle.vehicle_id + 1 : 1;

    const newVehicle = new Vehicle({
      vehicle_id: nextVehicleId,
      userId: user._id,
      number_plate,
      chassis_number,
      vehicle_type,
      model,
      color,
      year_of_manufacture: yearNum,
      engine_type,
      registration_date: new Date(),
      registration_expiry: regDate,
      status: "Active",
      notifications_enabled: true,
    });

    await newVehicle.save();

    console.log("✅ Vehicle added:", number_plate, "for user:", user.email);

    return NextResponse.json({
      success: true,
      message: "Vehicle added successfully",
      vehicle: newVehicle,
    });

  } catch (err: any) {
    console.error("Add vehicle error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
