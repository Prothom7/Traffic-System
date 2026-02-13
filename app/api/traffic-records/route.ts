import { NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import TrafficRecord from "@/models/trafficRecordModel";

export async function GET(req: Request) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const plate = searchParams.get("plate");

    if (!plate) {
      return NextResponse.json([], { status: 200 });
    }

    // fetch traffic records for this number plate
    const records = await TrafficRecord.find({
      number_plate: { $regex: plate, $options: "i" }
    })
      .sort({ timestamp: -1 })
      .select("number_plate violation timestamp");

    // transform to frontend-friendly format
    const data = records.map(r => {
      const doc = r.toObject();
      return {
        _id: doc._id,
        number_plate: doc.number_plate,
        violation_type: doc.violation?.type,
        severity: doc.violation?.severity,
        fine_amount: doc.violation?.fine_amount,
        status: doc.violation?.status,
        date: doc.timestamp,
        location_name: doc.location?.location_name,
        latitude: doc.location?.latitude,
        longitude: doc.location?.longitude,
        image_url: doc.image_url,
        speed: doc.speed,
      };
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch traffic records" },
      { status: 500 }
    );
  }
}
