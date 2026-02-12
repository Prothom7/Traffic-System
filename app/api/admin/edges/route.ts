import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Location from "@/models/locationModel";
import Edge from "@/models/edgeModel";

export async function GET(req: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json({ error: "Location ID required" }, { status: 400 });
    }

    const edges = await Edge.find({ from_location_id: locationId })
      .populate("to_location_id", "location_name latitude longitude")
      .lean();

    const result = edges.map((edge: any) => ({
      _id: edge._id.toString(),
      to_location_id: edge.to_location_id._id.toString(),
      to_location_name: edge.to_location_id.location_name,
      distance_km: edge.distance_km,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Edge fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch edges" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();
    const { from_location_id, edges } = body;

    if (!from_location_id || !Array.isArray(edges)) {
      return NextResponse.json(
        { error: "from_location_id and edges array required" },
        { status: 400 }
      );
    }

    await Edge.deleteMany({ from_location_id });

    const edgesToInsert = edges.map((edge: any) => ({
      from_location_id,
      to_location_id: edge.to_location_id,
      distance_km: edge.distance_km,
    }));

    if (edgesToInsert.length > 0) {
      await Edge.insertMany(edgesToInsert, { ordered: false });
    }

    return NextResponse.json({ success: true, count: edgesToInsert.length });
  } catch (err) {
    console.error("Edge update failed:", err);
    return NextResponse.json({ error: "Failed to update edges" }, { status: 500 });
  }
}
