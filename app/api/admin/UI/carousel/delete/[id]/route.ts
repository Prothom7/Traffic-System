import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import Carousel from "@/models/carouselModel";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connect();
    const { id } = params;

    const deleted = await Carousel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (err: any) {
    console.error("Delete carousel image error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
