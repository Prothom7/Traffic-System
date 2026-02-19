import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Carousel from "@/models/carouselModel";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "general";

    // First try to fetch carousel with matching category
    let images = await Carousel.find({ category }).sort({ createdAt: -1 });

    // If no images found for the category, fall back to general carousel
    if (images.length === 0) {
      images = await Carousel.find({ category: "general" }).sort({ createdAt: -1 });
    }

    // If still no images, fetch any carousel images
    if (images.length === 0) {
      images = await Carousel.find().sort({ createdAt: -1 });
    }

    return NextResponse.json({ success: true, data: images });
  } catch (err) {
    console.error("Error fetching carousel by category:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch carousel images" },
      { status: 500 }
    );
  }
}
