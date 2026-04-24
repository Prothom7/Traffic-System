// File: app/api/admin/newsfeed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import NewsFeed from "@/models/newsFeedModel";

// POST: Add a new news item
export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();

    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json(
        { success: false, error: "Title and Description are required" },
        { status: 400 }
      );
    }

    const news = await NewsFeed.create(body);
    return NextResponse.json({ success: true, data: news });
  } catch (err) {
    console.error("Failed to add news:", err);
    return NextResponse.json(
      { success: false, error: "Failed to add news" },
      { status: 500 }
    );
  }
}

// GET: Fetch all news items
export async function GET(req: NextRequest) {
  try {
    await connect();
    const news = await NewsFeed.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: news });
  } catch (err) {
    console.error("Failed to fetch news:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
