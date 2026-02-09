import { connect } from "@/dbConnection/dbConnection";
import Location from "@/models/locationModel";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connect();
    
    const locations = await Location.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
    }).select("location_name latitude longitude");

    const markers = locations.map((location: any) => ({
      name: location.location_name,
      latitude: location.latitude,
      longitude: location.longitude,
    }));

    return NextResponse.json(markers);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
