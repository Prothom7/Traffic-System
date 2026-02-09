import { connect } from "@/dbConnection/dbConnection";
import Location from "@/models/locationModel";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connect();
    const locations = await Location.find({});
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connect();
    const body = await request.json();

    const location = new Location({
      location_name: body.location_name,
      latitude: body.latitude,
      longitude: body.longitude,
      edges: body.edges || [],
    });

    await location.save();
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
