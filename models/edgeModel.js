import mongoose from "mongoose";

const EdgeSchema = new mongoose.Schema(
  {
    from_location_id: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    to_location_id: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    distance_km: { type: Number, required: true },
  },
  { timestamps: true }
);

EdgeSchema.index({ from_location_id: 1, to_location_id: 1 }, { unique: true });

const Edge = mongoose.models.Edge || mongoose.model("Edge", EdgeSchema);

export default Edge;
