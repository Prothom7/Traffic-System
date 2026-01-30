import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/helpers/mailer";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    await connect();
    const body = await request.json();

    const {
      number_plate,
      chassis_number,
      owner_name,
      owner_email,
      owner_contact,
      owner_address,
      vehicle_type,
      model,
      password,
      color,
      year_of_manufacture,
      engine_type,
      registration_expiry,
    } = body;

    if (
      !number_plate ||
      !chassis_number ||
      !owner_name ||
      !owner_email ||
      !owner_contact ||
      !owner_address ||
      !vehicle_type ||
      !model ||
      !password ||
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

    const existing = await Vehicle.findOne({
      $or: [{ number_plate }, { chassis_number }, { owner_email }],
    });
    if (existing) return NextResponse.json({ error: "Vehicle or email already registered" }, { status: 400 });

    const maxVehicle = await Vehicle.findOne().sort({ vehicle_id: -1 });
    const nextVehicleId = maxVehicle ? maxVehicle.vehicle_id + 1 : 1;

    const plainToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");

    const newVehicle = new Vehicle({
      vehicle_id: nextVehicleId,
      number_plate,
      chassis_number,
      owner_name,
      owner_email,
      owner_contact,
      owner_address,
      vehicle_type,
      model,
      password,
      color,
      year_of_manufacture: yearNum,
      engine_type,
      registration_date: new Date(),
      registration_expiry: regDate,
      credit_score: 100,
      status: "Active",
      isAdmin: false,
      isVerified: false,
      verifyToken: hashedToken,
      verifyTokenExpiry: Date.now() + 3600000,
    });

    await newVehicle.save();

    await sendEmail({
      email: owner_email,
      emailType: "VERIFY",
      token: plainToken,
      vehicleId: newVehicle._id.toString(),
    });

    return NextResponse.json({ success: true, message: "Vehicle registered and verification email sent." });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
