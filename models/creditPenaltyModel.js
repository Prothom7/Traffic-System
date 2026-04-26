import mongoose from "mongoose";

const creditPenaltySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    traffic_record_number_plate: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "EXTREME"],
      required: true,
    },
    reason: { type: String, required: true, trim: true },
    amount_deducted: { type: Number, required: true, min: 0 },
    expires_at: { type: Date, required: true, index: true },
    recovered_at: { type: Date },
    status: {
      type: String,
      enum: ["Active", "Recovered", "Expired"],
      default: "Active",
      index: true,
    },
  },
  { timestamps: true }
);

creditPenaltySchema.index({ user_id: 1, status: 1, expires_at: 1 });

const CreditPenalty =
  mongoose.models.CreditPenalty ||
  mongoose.model("CreditPenalty", creditPenaltySchema);

export default CreditPenalty;
