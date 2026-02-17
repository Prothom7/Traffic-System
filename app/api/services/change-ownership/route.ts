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
    const { number_plate, new_owner_email } = body;

    if (!number_plate || !new_owner_email) {
      return NextResponse.json(
        { success: false, error: "Number plate and new owner email are required" },
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

    // Verify current user owns this vehicle
    if (vehicle.userId.toString() !== decoded.id) {
      return NextResponse.json(
        { success: false, error: "You do not own this vehicle" },
        { status: 403 }
      );
    }

    // Find new owner
    const newOwner = await User.findOne({ email: new_owner_email });
    if (!newOwner) {
      return NextResponse.json(
        { success: false, error: "New owner with that email not found" },
        { status: 404 }
      );
    }

    // Transfer vehicle to new owner
    vehicle.userId = newOwner._id;
    await vehicle.save();

    return NextResponse.json({ success: true, data: vehicle, message: "Vehicle ownership transferred successfully" });
  } catch (err) {
    console.error("Failed to change ownership:", err);
    return NextResponse.json(
      { success: false, error: "Failed to change ownership" },
      { status: 500 }
    );
  }
}
