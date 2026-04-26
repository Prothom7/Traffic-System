import mongoose from "mongoose";

const renewalRequestSchema = new mongoose.Schema(
  {
    request_number: { type: Number, unique: true, index: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
      index: true,
    },
    months_remaining_at_request: { type: Number, required: true },
    current_registration_expiry: { type: Date, required: true },
    requested_registration_expiry: { type: Date, required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    admin_note: { type: String, trim: true },
    decided_at: { type: Date },
    payment_required: { type: Boolean, default: true, required: true },
    payment_status: {
      type: String,
      enum: ["not_required", "pending", "success", "failed"],
      default: "not_required",
      required: true,
    },
  },
  { timestamps: true }
);

renewalRequestSchema.index({ userId: 1, status: 1, createdAt: -1 });
renewalRequestSchema.index({ vehicleId: 1, status: 1 });

const RenewalRequest = mongoose.models.RenewalRequest || mongoose.model("RenewalRequest", renewalRequestSchema);
export default RenewalRequest;
