// File: app/api/admin/newsfeed/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import NewsFeed from "@/models/newsFeedModel";

// DELETE: Delete a news item by ID from path parameter
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const result = await NewsFeed.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: "News item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "News item deleted successfully" });
  } catch (err) {
    console.error("Failed to delete news:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete news" },
      { status: 500 }
    );
  }
}
