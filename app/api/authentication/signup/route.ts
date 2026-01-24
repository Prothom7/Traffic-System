import { connect } from "@/dbConnection/dbConnection";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { sendEmail } from "@/helpers/mailer";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    await connect();
    const body = await request.json();

    // --- USER SIGNUP ---
    const { username, email, password, isAdmin = false } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Generate a plain token
    const plainToken = crypto.randomBytes(32).toString("hex");

    // Hash token for storage
    const hashedToken = await bcryptjs.hash(plainToken, 10);

    // Create user in DB
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin,
      verifyToken: hashedToken,
      verifyTokenExpiry: Date.now() + 3600000, // 1 hour
      isVerified: false,
    });

    await newUser.save();

    // Send verification email with **plain token**
    await sendEmail({
      email,
      emailType: "VERIFY",
      token: plainToken, // send plain token
      userId: newUser._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: "User registered. Verification email sent.",
    });
  } catch (error: any) {
    console.error("Signup route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
