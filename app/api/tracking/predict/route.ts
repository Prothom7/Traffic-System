import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import TrafficRecord from "@/models/trafficRecordModel";
import Edge from "@/models/edgeModel";
import Location from "@/models/locationModel";

const EARTH_KM_PER_DEG_LAT = 111.32;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function kmPerDegLng(lat: number) {
  return EARTH_KM_PER_DEG_LAT * Math.cos(toRadians(lat));
}

const BN_TO_ASCII_DIGIT: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

function toAsciiDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => BN_TO_ASCII_DIGIT[digit] || digit);
}

function normalizePlate(value: string): string {
  return toAsciiDigits(value)
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-")
    .trim();
}

function getPlateCandidates(value: string): string[] {
  const normalized = normalizePlate(value);
  const noMetro = normalized
    .replace(/\bMETRO\b|মেট্রো/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return Array.from(
    new Set([
      normalized,
      normalized.replace(/-/g, ""),
      normalized.replace(/\s+/g, ""),
      noMetro,
      noMetro.replace(/-/g, ""),
      noMetro.replace(/\s+/g, ""),
    ])
  ).filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const plate = String(searchParams.get("plate") || "").trim().toUpperCase();
    const lastSeenLocation = String(searchParams.get("lastSeenLocation") || "").trim();
    const futurePoints = Math.min(Math.max(Number(searchParams.get("points") || 5), 3), 10);
    const stepMinutes = Math.min(Math.max(Number(searchParams.get("stepMinutes") || 2), 1), 10);

    if (!plate) {
      return NextResponse.json(
        { success: false, error: "plate query parameter is required" },
        { status: 400 }
      );
    }

    const normalizedCandidates = getPlateCandidates(plate);
    const plateMatcher = normalizedCandidates.map((candidate) => ({
      number_plate: { $regex: `^${escapeRegExp(candidate)}$`, $options: "i" },
    }));

    const records = await TrafficRecord.find({
      $or: plateMatcher,
      "location.latitude": { $type: "number" },
      "location.longitude": { $type: "number" },
    })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    const history = [...records]
      .reverse()
      .map((record) => ({
        _id: String(record._id),
        latitude: Number(record.location?.latitude),
        longitude: Number(record.location?.longitude),
        timestamp: record.timestamp,
        location_name: record.location?.location_name || "Unknown",
      }))
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

    let adjacent_nodes: Array<{
      location_id: string;
      location_name: string;
      latitude: number;
      longitude: number;
      distance_km: number;
    }> = [];

    let currentFromFallback: {
      latitude: number;
      longitude: number;
      timestamp?: Date;
      location_name?: string;
      speed_kmh?: number;
    } | null = null;

    const resolveAdjacentNodes = async (locationId: string) => {
      const edges = await Edge.find({ from_location_id: locationId })
        .populate("to_location_id", "location_name latitude longitude")
        .lean();

      return edges
        .map((edge: any) => ({
          location_id: String(edge.to_location_id?._id || ""),
          location_name: String(edge.to_location_id?.location_name || "Unknown"),
          latitude: Number(edge.to_location_id?.latitude),
          longitude: Number(edge.to_location_id?.longitude),
          distance_km: Number(edge.distance_km || 0),
        }))
        .filter((node) => Number.isFinite(node.latitude) && Number.isFinite(node.longitude));
    };

    if (records[0]?.location_id) {
      const lastLocationId = String(records[0].location_id);
      adjacent_nodes = await resolveAdjacentNodes(lastLocationId);
    } else if (lastSeenLocation) {
      const fallbackLocationDoc = await Location.findOne({
        location_name: { $regex: `^${escapeRegExp(lastSeenLocation)}$`, $options: "i" },
      })
        .select("_id location_name latitude longitude")
        .lean();

      if (fallbackLocationDoc) {
        currentFromFallback = {
          latitude: Number(fallbackLocationDoc.latitude),
          longitude: Number(fallbackLocationDoc.longitude),
          timestamp: new Date(),
          location_name: String(fallbackLocationDoc.location_name || lastSeenLocation),
          speed_kmh: undefined,
        };
        adjacent_nodes = await resolveAdjacentNodes(String(fallbackLocationDoc._id));
      }
    }

    if (records.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          current: records[0]
            ? {
                latitude: records[0].location?.latitude,
                longitude: records[0].location?.longitude,
                timestamp: records[0].timestamp,
                location_name: records[0].location?.location_name || "Unknown",
              }
            : currentFromFallback,
          predictions: [],
          history,
          adjacent_nodes,
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
        history,
        adjacent_nodes,
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
