import mongoose from "mongoose";

const vehicleReportSchema = new mongoose.Schema(
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
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Investigating", "Resolved"],
      default: "Pending",
      index: true,
    },
  },
  { timestamps: true }
);

vehicleReportSchema.index({ user_id: 1, createdAt: -1 });
vehicleReportSchema.index({ vehicle_id: 1, status: 1 });

const VehicleReport =
  mongoose.models.VehicleReport ||
  mongoose.model("VehicleReport", vehicleReportSchema);

export default VehicleReport;
