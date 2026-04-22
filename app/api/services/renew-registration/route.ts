import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
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

    // Verify user owns this vehicle
    if (vehicle.userId.toString() !== decoded.id) {
      return NextResponse.json(
        { success: false, error: "You do not own this vehicle" },
        { status: 403 }
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