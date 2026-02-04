// File: app/api/dashboard/carousel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Carousel from "@/models/carouselModel"; 

export async function GET(req: NextRequest) {
  try {
    await connect();

    const images = await Carousel.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: images });
  } catch (err) {
    console.error("Error fetching carousel images:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
