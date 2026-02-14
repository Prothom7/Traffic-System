import { NextResponse } from "next/server";
import TrafficRecord from "@/models/trafficRecordModel";
import { connect } from "@/dbConnection/dbConnection";



export async function GET() {
  try {
    await connect();
    const records = await TrafficRecord.find()
      .sort({ timestamp: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({ records });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load analysis data." },
      { status: 500 }
    );
  }
}