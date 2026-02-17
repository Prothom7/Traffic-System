// File: app/api/authentication/signin/route.ts
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import bcrypt from "bcryptjs";
import { signToken } from "@/helpers/jwtToken";
import { connect } from "@/dbConnection/dbConnection";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }
    await connect();

    const user = await User.findOne({ email }).select(
      "+password",
    );
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 400 },
      );
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      type: "user",
      name: user.owner_name,
    });

    return NextResponse.json({ success: true, token });
  } catch (err: any) {
    console.error("Signin error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
