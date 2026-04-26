import { NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import TrafficRecord from "@/models/trafficRecordModel";
import Location from "@/models/locationModel";

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

export async function GET(req: Request) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const plate = searchParams.get("plate");

    if (!plate) {
      return NextResponse.json([], { status: 200 });
    }

    const normalizedCandidates = getPlateCandidates(plate);
    const plateMatcher = normalizedCandidates.map((candidate) => ({
      number_plate: { $regex: `^${escapeRegExp(candidate)}$`, $options: "i" },
    }));

    const records = await TrafficRecord.find({
      $or: plateMatcher,
    })
      .sort({ timestamp: -1 })
      .lean(); // ✅ IMPORTANT FIX (faster + safer)

    if (!records.length) {
      return NextResponse.json([]);
    }

    // collect location IDs
    const locationIds = [
      ...new Set(
        records
          .map((r) => r.location_id)
          .filter(Boolean)
          .map((id) => id.toString())
      ),
    ];

    const locations = await Location.find({
      _id: { $in: locationIds },
    }).lean();

    const locationMap = new Map(
      locations.map((l) => [l._id.toString(), l])
    );

    // ✅ FIX 2: SAFE NORMALIZATION (NO undefined fields)
    const data = records.map((r) => {
      const loc = r.location_id
        ? locationMap.get(r.location_id.toString())
        : null;

      return {
        _id: r._id,
        number_plate: r.number_plate || "",
        
        violation_type:
          r.violation?.type || r.violation_type || null,

        severity:
          r.violation?.severity || r.severity || "Low",

        fine_amount:
          r.violation?.fine_amount || r.fine_amount || 0,

        status:
          r.violation?.status || r.status || "Pending",

        paid_at:
          r.violation?.paid_at || r.paid_at || null,

        payment_reference:
          r.violation?.payment_reference || null,

        date: r.timestamp || r.date || null,

        location_name:
          loc?.location_name || r.location?.location_name || "Unknown",

        latitude:
          loc?.latitude ?? r.location?.latitude ?? null,

        longitude:
          loc?.longitude ?? r.location?.longitude ?? null,

        image_url: r.image_url || null,
        speed: r.speed || null,
      };
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("Traffic API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch traffic records" },
      { status: 500 }
    );
  }
}