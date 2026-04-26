import mongoose from "mongoose";

const stolenVehicleSchema = new mongoose.Schema(
  {
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    number_plate: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    chassis_number: {
      type: String,
      trim: true,
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
    last_seen_location: { type: String, trim: true },
    last_seen_time: { type: Date },
    police_report_number: { type: String, trim: true },
    additional_info: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Stolen", "Recovered", "open", "recovered"],
      default: "Stolen",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

stolenVehicleSchema.index({ reported_by_user_id: 1, createdAt: -1 });
stolenVehicleSchema.index({ number_plate: 1, status: 1 });
stolenVehicleSchema.index({ chassis_number: 1, status: 1 });
stolenVehicleSchema.index({ vehicleId: 1, createdAt: -1 });

const StolenVehicle = mongoose.models.StolenVehicle || mongoose.model("StolenVehicle", stolenVehicleSchema);
export default StolenVehicle;
