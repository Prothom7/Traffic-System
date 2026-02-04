// File: models/carouselModel.js
const mongoose = require("mongoose");

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
  },
  {
    timestamps: true, 
  }
);

const Carousel =
  mongoose.models.Carousel || mongoose.model("Carousel", carouselSchema);

module.exports = Carousel;
