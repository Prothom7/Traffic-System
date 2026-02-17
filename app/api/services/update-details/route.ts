import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
import User from "@/models/userModel";
import { decodeJWTToken } from "@/helpers/jwtToken";

export async function POST(req: NextRequest) {
  try {
    await connect();

    // Verify user is authenticated
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = decodeJWTToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { number_plate, color, contact, address } = body;

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

    // Verify user owns this vehicle
    if (vehicle.userId.toString() !== decoded.id) {
      return NextResponse.json(
        { success: false, error: "You do not own this vehicle" },
        { status: 403 }
      );
    }

    // Update vehicle details
    if (color) vehicle.color = color;
    await vehicle.save();

    // Update user contact and address
    const user = await User.findById(decoded.id);
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

