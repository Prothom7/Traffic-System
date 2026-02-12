// vehicleModel.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const vehicleSchema = new mongoose.Schema(
  {
    vehicle_id: { type: Number, unique: true, index: true, required: true },
    number_plate: { type: String, required: true, unique: true, uppercase: true, trim: true },
    chassis_number: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },

    owner_name: { type: String, required: true, trim: true },
    owner_email: { type: String, required: true, lowercase: true, trim: true },
    owner_contact: { type: String, required: true, trim: true },
    owner_address: { type: String, required: true, trim: true },

    credit_score: { type: Number, required: true, default: 100, min: 0 },

    vehicle_type: { type: String, enum: ["Car", "Truck", "Motorcycle", "Bus", "Van", "Other"], required: true },
    model: { type: String, required: true, trim: true },
    year_of_manufacture: { type: Number, required: true, min: 1900, max: new Date().getFullYear() },
    color: { type: String, required: true, trim: true },
    engine_type: { type: String, enum: ["Petrol", "Diesel", "Electric", "Hybrid", "CNG", "Other"], required: true },

    registration_date: { type: Date, required: true, default: Date.now },
    registration_expiry: { type: Date, required: true },

    status: { type: String, enum: ["Active", "Stolen", "Suspended", "Expired"], required: true, default: "Active" },

    isAdmin: { type: Boolean, required: true, default: false },
    isVerified: { type: Boolean, required: true, default: false },
    notifications_enabled: { type: Boolean, required: true, default: true },

    verifyToken: { type: String, required: true },
    verifyTokenExpiry: { type: Date, required: true },
  },
  { timestamps: true }
);

// Hash password
vehicleSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
vehicleSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export model
const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
