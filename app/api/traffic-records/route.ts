import { NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import TrafficRecord from "@/models/trafficRecordModel";
import Location from "@/models/locationModel";

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
      .select("number_plate violation timestamp location_id location image_url speed");

    const locationIds = Array.from(
      new Set(
        records
          .map((record) => String(record.location_id || ""))
          .filter((locationId) => !!locationId)
      )
    );

    const locationDocs = locationIds.length
      ? await Location.find({ _id: { $in: locationIds } })
          .select("location_name latitude longitude")
          .lean()
      : [];

    const locationById = new Map(
      locationDocs.map((location) => [String(location._id), location])
    );

    // transform to frontend-friendly format
    const data = records.map(r => {
      const doc = r.toObject();
      const locationFromModel = doc.location_id
        ? locationById.get(String(doc.location_id))
        : null;
      const resolvedLocationName =
        locationFromModel?.location_name || doc.location?.location_name;
      const resolvedLatitude =
        typeof locationFromModel?.latitude === "number"
          ? locationFromModel.latitude
          : doc.location?.latitude;
      const resolvedLongitude =
        typeof locationFromModel?.longitude === "number"
          ? locationFromModel.longitude
          : doc.location?.longitude;

      return {
        _id: doc._id,
        number_plate: doc.number_plate,
        violation_type: doc.violation?.type,
        severity: doc.violation?.severity,
        fine_amount: doc.violation?.fine_amount,
        status: doc.violation?.status,
        paid_at: doc.violation?.paid_at,
        payment_reference: doc.violation?.payment_reference,
        date: doc.timestamp,
        location_name: resolvedLocationName,
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
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
