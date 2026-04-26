import mongoose from "mongoose";

const ownershipChangeRequestSchema = new mongoose.Schema(
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
    new_owner_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    new_owner_name: { type: String, trim: true },
    new_owner_email: { type: String, trim: true, lowercase: true, required: true },
    new_owner_contact: { type: String, trim: true },
    new_owner_address: { type: String, trim: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    admin_note: { type: String, trim: true },
    decided_at: { type: Date },
    transferred_at: { type: Date },
  },
  { timestamps: true }
);

ownershipChangeRequestSchema.index({ userId: 1, status: 1, createdAt: -1 });
ownershipChangeRequestSchema.index({ vehicleId: 1, status: 1 });

const OwnershipChangeRequest =
  mongoose.models.OwnershipChangeRequest ||
  mongoose.model("OwnershipChangeRequest", ownershipChangeRequestSchema);
export default OwnershipChangeRequest;
