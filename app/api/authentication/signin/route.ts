// File: app/api/authentication/signin/route.ts
import { NextRequest, NextResponse } from "next/server";
import Vehicle from "@/models/vehicleModel";
import bcrypt from "bcryptjs";
import { signToken } from "@/helpers/jwtToken";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await Vehicle.db; // ensure Mongoose connected (or use your connect function)

    const vehicle = await Vehicle.findOne({ owner_email: email }).select("+password");
    if (!vehicle) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // check password
    const isMatch = await vehicle.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    if (!vehicle.isVerified) {
      return NextResponse.json({ error: "Email not verified" }, { status: 400 });
    }

    // Generate JWT token
    const token = signToken({
      id: vehicle._id.toString(),
      email: vehicle.owner_email,
      type: "vehicle",
      name: vehicle.owner_name,
    });

    return NextResponse.json({ success: true, token });
  } catch (err: any) {
    console.error("Signin error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
