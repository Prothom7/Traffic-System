import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import { decodeJWTToken } from "@/helpers/jwtToken";
import Notification from "@/models/notificationModel";
import Vehicle from "@/models/vehicleModel";
import User from "@/models/userModel";

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  const { searchParams } = new URL(req.url);
  return searchParams.get("token");
}

export async function GET(req: NextRequest) {
  try {
    await connect();

    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = decodeJWTToken(token);
    if (!decoded?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user (decoded.id is now user_id)
    const user = await User.findById(decoded.id).select("notifications_enabled");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const notificationsEnabled = user?.notifications_enabled !== false;

    if (!notificationsEnabled) {
      return NextResponse.json({ notifications: [], notificationsEnabled: false });
    }

    // Get all vehicles for this user
    const vehicles = await Vehicle.find({ userId: decoded.id });
    const vehicleIds = vehicles.map((v) => v._id);

    // Get notifications for all vehicles
    const notifications = await Notification.find({ vehicle_id: { $in: vehicleIds } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const data = notifications.map((n) => ({
      _id: n._id.toString(),
      number_plate: n.number_plate,
      violation_type: n.violation_type,
      cause: n.cause,
      camera_location: n.camera_location || "Unknown",
      message: n.message,
      createdAt: n.createdAt,
    }));

    return NextResponse.json({ notifications: data, notificationsEnabled: true });
  } catch (err) {
    console.error("Notifications fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
