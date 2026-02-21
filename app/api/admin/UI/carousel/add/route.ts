import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Carousel from "@/models/carouselModel";

export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();
    const { imageUrl, title, description, category } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const newImage = new Carousel({ imageUrl, title, description, category: category || "general" });
    await newImage.save();

    return NextResponse.json({ success: true, data: newImage });
  } catch (err: any) {
    console.error("Add carousel image error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
