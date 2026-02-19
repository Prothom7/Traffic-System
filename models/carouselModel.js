import mongoose from "mongoose";

const carouselSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      enum: [
        "perfect_credit",
        "good_credit",
        "fair_credit",
        "low_credit",
        "expired_registration",
        "expiring_soon",
        "pending_tickets",
        "active_violations",
        "paid_tickets",
        "clean_record",
        "good_standing",
        "general"
      ],
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Carousel || mongoose.model("Carousel", carouselSchema);
