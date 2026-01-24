import { NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import TrafficRecord from "@/models/trafficRecordModel";

export async function GET() {
  try {
    await connect();

    const records = await TrafficRecord.find({ "violation": { $exists: true } })
      .sort({ timestamp: -1 })
      .select("number_plate violation timestamp");

    const violations = records.map(r => {
      const doc = r.toObject();
      return {
        _id: doc._id,
        plate: doc.number_plate,
        type: doc.violation?.type || "Unknown",
        date: doc.timestamp,
      };
    });

    return NextResponse.json(violations);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch violations" },
      { status: 500 }
    );
  }
}
