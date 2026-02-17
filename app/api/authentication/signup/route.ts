import { connect } from "@/dbConnection/dbConnection";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/helpers/mailer";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    await connect();
    const body = await request.json();

    const {
      owner_name,
      email,
      password,
      contact,
      address,
    } = body;

    if (
      !owner_name ||
      !email ||
      !password ||
      !contact ||
      !address
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existing = await User.findOne({
      $or: [{ email }],
    });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    const maxUser = await User.findOne().sort({ user_id: -1 });
    const nextUserId = maxUser ? maxUser.user_id + 1 : 1;

    const plainToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");

    const newUser = new User({
      user_id: nextUserId,
      owner_name,
      email,
      password,
      contact,
      address,
      credit_score: 100,
      isAdmin: false,
      isVerified: false,
      verifyToken: hashedToken,
      verifyTokenExpiry: Date.now() + 3600000,
    });

    await newUser.save();

    await sendEmail({
      email: email,
      emailType: "VERIFY",
      token: plainToken,
      userId: newUser._id.toString(),
    });

    return NextResponse.json({ success: true, message: "User registered and verification email sent." });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
