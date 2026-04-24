import mongoose from "mongoose";

const stolenVehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      unique: true,
      index: true,
    },
    reported_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    incident_date: { type: Date, required: true },
    incident_location: { type: String, required: true, trim: true },
    police_report_number: { type: String, trim: true },
    additional_info: { type: String, trim: true },
    status: {
      type: String,
      enum: ["open", "recovered"],
      default: "open",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

stolenVehicleSchema.index({ reported_by_user_id: 1, createdAt: -1 });

const StolenVehicle = mongoose.models.StolenVehicle || mongoose.model("StolenVehicle", stolenVehicleSchema);
export default StolenVehicle;
