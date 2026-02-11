import { connect } from "@/dbConnection/dbConnection";
import Location from "@/models/locationModel";
import Edge from "@/models/edgeModel";
import { NextResponse } from "next/server";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadiusKm * c).toFixed(3));
}

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
    });

    await location.save();

    const otherLocations = await Location.find({ _id: { $ne: location._id } });
    const edgesToInsert = otherLocations.flatMap((other) => {
      const distance = calculateDistanceKm(
        location.latitude,
        location.longitude,
        other.latitude,
        other.longitude
      );

      return [
        {
          from_location_id: location._id,
          to_location_id: other._id,
          distance_km: distance,
        },
        {
          from_location_id: other._id,
          to_location_id: location._id,
          distance_km: distance,
        },
      ];
    });

    if (edgesToInsert.length > 0) {
      await Edge.insertMany(edgesToInsert, { ordered: false });
    }

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
