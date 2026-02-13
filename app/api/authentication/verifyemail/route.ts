// File: app/api/authentication/verifyemail/route.ts
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
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

    // Find all vehicles whose verifyToken hasn't expired
    const vehicles = await Vehicle.find({
      verifyTokenExpiry: { $gt: Date.now() },
    });

    let vehicleFound = null;

    // Compare SHA-256 hash of the token with the stored hashed token
    for (const vehicle of vehicles) {
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      if (hashedToken === vehicle.verifyToken) {
        vehicleFound = vehicle;
        break;
      }
    }

    if (!vehicleFound) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Update verification status without triggering required-field validation
    await Vehicle.updateOne(
      { _id: vehicleFound._id },
      {
        $set: { isVerified: true },
        $unset: { verifyToken: "", verifyTokenExpiry: "" },
      }
    );

    console.log("✅ Vehicle owner verified:", vehicleFound.owner_email);

    // Redirect to signin page after successful verification
    return NextResponse.redirect(
      new URL("/authentication/signin?verified=1", request.url)
    );

  } catch (error: any) {
    console.error("Verify vehicle email error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
