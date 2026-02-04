const mongoose = require("mongoose");

const newsFeedSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    source: {
      type: String,
    },
    category: {
      type: String,
    },
    readingTime: {
      type: String,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const NewsFeed =
  mongoose.models.NewsFeed || mongoose.model("NewsFeed", newsFeedSchema);

module.exports = NewsFeed;
