import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  location_name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

export default mongoose.models.Location || mongoose.model("Location", LocationSchema);
