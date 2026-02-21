import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Carousel from "@/models/carouselModel";
import User from "@/models/userModel";
import Vehicle from "@/models/vehicleModel";
import TrafficRecord from "@/models/trafficRecordModel";
import { decodeJWTToken } from "@/helpers/jwtToken";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = decodeJWTToken(token) as any;
    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.id).select("credit_score");
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const vehicles = await Vehicle.find({ userId: decoded.id });
    const vehicleIds = vehicles.map((vehicle: any) => vehicle._id);
    const now = new Date();

    const expiredRegistrations = vehicles.filter(
      (vehicle: any) => new Date(vehicle.registration_expiry) < now
    );
    const expiringRegistrations = vehicles.filter((vehicle: any) => {
      const expiry = new Date(vehicle.registration_expiry);
      const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });

    const trafficRecords = await TrafficRecord.find({
      vehicle_id: { $in: vehicleIds },
    }).select("violation");

    const activeTickets = trafficRecords.reduce((count: number, record: any) => {
      if (!record.violation) return count;
      const status = String(record.violation.status || "").toLowerCase();
      if (status === "pending" || status === "active") {
        return count + 1;
      }
      return count;
    }, 0);

    const creditScore = user.credit_score || 100;
    let carouselCategory = "general";

    if (expiredRegistrations.length > 0) {
      carouselCategory = "expired_registration";
    } else if (expiringRegistrations.length > 0) {
      carouselCategory = "expiring_soon";
    } else if (activeTickets > 0) {
      carouselCategory = "pending_tickets";
    } else if (creditScore >= 95) {
      carouselCategory = "perfect_credit";
    } else if (creditScore >= 70) {
      carouselCategory = "good_credit";
    } else if (creditScore >= 50) {
      carouselCategory = "fair_credit";
    } else {
      carouselCategory = "low_credit";
    }

    const images = await Carousel.find({ category: carouselCategory }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: images,
      category: carouselCategory,
    });
  } catch (err) {
    console.error("Error fetching carousel by category:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch carousel images" },
      { status: 500 }
    );
  }
}
