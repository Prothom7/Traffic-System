// vehicleModel.js
import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicle_id: { type: Number, unique: true, index: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    number_plate: { type: String, required: true, unique: true, uppercase: true, trim: true },
    chassis_number: { type: String, required: true, unique: true, trim: true },

    vehicle_type: { type: String, enum: ["Car", "Truck", "Motorcycle", "Bus", "Van", "Other"], required: true },
    model: { type: String, required: true, trim: true },
    year_of_manufacture: { type: Number, required: true, min: 1900, max: new Date().getFullYear() },
    color: { type: String, required: true, trim: true },
    engine_type: { type: String, enum: ["Petrol", "Diesel", "Electric", "Hybrid", "CNG", "Other"], required: true },

    registration_date: { type: Date, required: true, default: Date.now },
    registration_expiry: { type: Date, required: true },

    status: { type: String, enum: ["Active", "Stolen", "Suspended", "Expired"], required: true, default: "Active" },
    notifications_enabled: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

// Export model
const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
