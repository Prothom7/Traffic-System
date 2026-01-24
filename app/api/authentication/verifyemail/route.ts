import { connect } from "@/dbConnection/dbConnection";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // Get token from URL
    const token = request.nextUrl.searchParams.get("token");
    console.log("Token from email link:", token);

    if (!token) {
      return NextResponse.json({ error: "Token missing" }, { status: 400 });
    }

    // Find all users whose token hasn't expired
    const users = await User.find({
      verifyTokenExpiry: { $gt: Date.now() },
    });

    let userFound = null;

    // Compare hashed token with the plain token from URL
    for (const user of users) {
      const match = await bcryptjs.compare(token, user.verifyToken!);
      if (match) {
        userFound = user;
        break;
      }
    }

    if (!userFound) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Update user verification status
    userFound.isVerified = true;
    userFound.verifyToken = undefined;
    userFound.verifyTokenExpiry = undefined;
    await userFound.save();

    console.log("✅ User verified:", userFound.email);

    // Redirect to login page after successful verification
    return NextResponse.redirect(new URL("/authentication/signin?verified=1", request.url));

  } catch (error: any) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
