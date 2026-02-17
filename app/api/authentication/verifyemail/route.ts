// File: app/api/authentication/verifyemail/route.ts
import { connect } from "@/dbConnection/dbConnection";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    await connect(); // Connect to MongoDB

    // Get token from URL
    const token = request.nextUrl.searchParams.get("token");
    console.log("Token from email link:", token);

    if (!token) {
      return NextResponse.json({ error: "Token missing" }, { status: 400 });
    }

    // Find all users whose verifyToken hasn't expired
    const users = await User.find({
      verifyTokenExpiry: { $gt: Date.now() },
    });

    let userFound = null;

    // Compare SHA-256 hash of the token with the stored hashed token
    for (const user of users) {
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      if (hashedToken === user.verifyToken) {
        userFound = user;
        break;
      }
    }

    if (!userFound) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Update verification status without triggering required-field validation
    await User.updateOne(
      { _id: userFound._id },
      {
        $set: { isVerified: true },
        $unset: { verifyToken: "", verifyTokenExpiry: "" },
      }
    );

    console.log("✅ User verified:", userFound.email);

    // Redirect to signin page after successful verification
    return NextResponse.redirect(
      new URL("/authentication/signin?verified=1", request.url)
    );

  } catch (error: any) {
    console.error("Verify user email error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
