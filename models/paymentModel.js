import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    request_type: {
      type: String,
      enum: ["renewal"],
      required: true,
      index: true,
    },
    request_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      refPath: "request_model",
    },
    request_model: {
      type: String,
      required: true,
      enum: ["RenewalRequest"],
    },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      required: true,
      index: true,
    },
    payment_method: { type: String, default: "mock_gateway" },
    gateway_reference: { type: String, trim: true },
    transaction_id: { type: String, trim: true },
    gateway_session_token: { type: String, trim: true },
    gateway_provider_status: {
      type: String,
      enum: ["initiated", "success", "failed"],
      default: "initiated",
      required: true,
    },
    paid_at: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ request_type: 1, request_id: 1 }, { unique: true });
paymentSchema.index({ user_id: 1, createdAt: -1 });
paymentSchema.index({ transaction_id: 1 }, { unique: true, sparse: true });
paymentSchema.index({ gateway_session_token: 1 }, { unique: true, sparse: true });

const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
export default Payment;
