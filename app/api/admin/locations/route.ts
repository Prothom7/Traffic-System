import { connect } from "@/dbConnection/dbConnection";
import Location from "@/models/locationModel";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connect();
    
    // Get all locations - latitude and longitude are required fields in the schema
    const locations = await Location.find({}).select("location_name latitude longitude");

    console.log(`Found ${locations.length} locations in database`);

    const markers = locations.map((location: any) => ({
      name: location.location_name,
      latitude: location.latitude,
      longitude: location.longitude,
    }));

    console.log("Returning markers:", JSON.stringify(markers));

    return NextResponse.json(markers);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
