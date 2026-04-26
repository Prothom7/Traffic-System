import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import TrafficRecord from "@/models/trafficRecordModel";

const EARTH_KM_PER_DEG_LAT = 111.32;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function kmPerDegLng(lat: number) {
  return EARTH_KM_PER_DEG_LAT * Math.cos(toRadians(lat));
}

export async function GET(req: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const plate = String(searchParams.get("plate") || "").trim().toUpperCase();
    const futurePoints = Math.min(Math.max(Number(searchParams.get("points") || 5), 3), 10);
    const stepMinutes = Math.min(Math.max(Number(searchParams.get("stepMinutes") || 2), 1), 10);

    if (!plate) {
      return NextResponse.json(
        { success: false, error: "plate query parameter is required" },
        { status: 400 }
      );
    }

    const records = await TrafficRecord.find({
      number_plate: plate,
      "location.latitude": { $type: "number" },
      "location.longitude": { $type: "number" },
    })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    if (records.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          current: records[0]
            ? {
                latitude: records[0].location?.latitude,
                longitude: records[0].location?.longitude,
                timestamp: records[0].timestamp,
              }
            : null,
          predictions: [],
          message: "Not enough historical points for prediction",
        },
      });
    }

    const latest = records[0];
    const previous = records[1];

    const lat1 = Number(previous.location?.latitude);
    const lng1 = Number(previous.location?.longitude);
    const lat2 = Number(latest.location?.latitude);
    const lng2 = Number(latest.location?.longitude);

    const t1 = new Date(previous.timestamp).getTime();
    const t2 = new Date(latest.timestamp).getTime();
    const deltaHours = Math.max((t2 - t1) / (1000 * 60 * 60), 1 / 60);

    const dLatDeg = lat2 - lat1;
    const dLngDeg = lng2 - lng1;

    const latKm = dLatDeg * EARTH_KM_PER_DEG_LAT;
    const lngKm = dLngDeg * kmPerDegLng(lat2);

    const derivedSpeed = Math.sqrt(latKm * latKm + lngKm * lngKm) / deltaHours;
    const speedKmh = Number(latest.speed || derivedSpeed || 0);

    const totalVectorKm = Math.sqrt(latKm * latKm + lngKm * lngKm) || 0.001;
    const normLat = latKm / totalVectorKm;
    const normLng = lngKm / totalVectorKm;

    const predictions = [] as Array<{
      step: number;
      eta: string;
      latitude: number;
      longitude: number;
      estimated_speed_kmh: number;
    }>;

    let currentLat = lat2;
    let currentLng = lng2;

    for (let i = 1; i <= futurePoints; i += 1) {
      const travelKm = speedKmh * (stepMinutes / 60);
      const moveLatKm = normLat * travelKm;
      const moveLngKm = normLng * travelKm;

      currentLat += moveLatKm / EARTH_KM_PER_DEG_LAT;
      currentLng += moveLngKm / Math.max(kmPerDegLng(currentLat), 0.0001);

      const eta = new Date(new Date(latest.timestamp).getTime() + i * stepMinutes * 60 * 1000);
      predictions.push({
        step: i,
        eta: eta.toISOString(),
        latitude: Number(currentLat.toFixed(6)),
        longitude: Number(currentLng.toFixed(6)),
        estimated_speed_kmh: Number(speedKmh.toFixed(2)),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        current: {
          latitude: lat2,
          longitude: lng2,
          timestamp: latest.timestamp,
          location_name: latest.location?.location_name || "Unknown",
          speed_kmh: Number(speedKmh.toFixed(2)),
        },
        predictions,
        sourceRecordId: String(latest._id),
      },
    });
  } catch (error: any) {
    console.error("Tracking prediction error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to predict tracking path" },
      { status: 500 }
    );
  }
}
