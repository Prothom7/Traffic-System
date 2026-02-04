import { connect } from "@/dbConnection/dbConnection";
const NewsFeed = require("@/models/newsFeedModel");

export async function GET(req: Request) {
  try {
    // Connect to MongoDB
    await connect();

    // Fetch all news items, sorted by newest first
    const newsItems = await NewsFeed.find().sort({ createdAt: -1 });

    return new Response(
      JSON.stringify({ success: true, data: newsItems }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error fetching news feed:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch news feed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
