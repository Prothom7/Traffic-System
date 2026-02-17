import { NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Vehicle from "@/models/vehicleModel";
import TrafficRecord from "@/models/trafficRecordModel";
import { decodeJWTToken } from "@/helpers/jwtToken";

export async function GET(req: Request) {
  try {
    await connect();

    // Extract token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = decodeJWTToken(token) as any;

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // Get all vehicles for this user
    const vehicles = await Vehicle.find({ userId });
    const vehicleIds = vehicles.map((v: any) => v._id);

    // Get vehicle count
    const vehicleCount = vehicles.length;

    // Get traffic records for all user's vehicles
    const trafficRecords = await TrafficRecord.find({
      vehicle_id: { $in: vehicleIds }
    });

    // Count tickets by status
    let activeTickets = 0;
    let paidTickets = 0;
    let totalFines = 0;

    trafficRecords.forEach((record: any) => {
      if (record.violation) {
        const status = record.violation.status || "Pending";
        const fineAmount = record.violation.fine_amount || 0;

        if (status.toLowerCase() === "pending" || status.toLowerCase() === "active") {
          activeTickets++;
        } else if (status.toLowerCase() === "paid") {
          paidTickets++;
        }

        totalFines += fineAmount;
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          myVehicles: vehicleCount,
          activeTickets,
          paidTickets,
          totalFines
        }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
