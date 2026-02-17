import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import User from "@/models/userModel";
import Vehicle from "@/models/vehicleModel";
import { decodeJWTToken } from "@/helpers/jwtToken";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = decodeJWTToken(token);

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.id).select("-password -verifyToken -verifyTokenExpiry");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch vehicles for this user
    const vehicles = await Vehicle.find({ userId: decoded.id });

    return NextResponse.json({ success: true, data: { user, vehicles } });
  } catch (err) {
    console.error("Failed to fetch profile:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
