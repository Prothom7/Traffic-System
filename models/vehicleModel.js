import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
    number_plate: { type: String, unique: true, required: true },
    owner_name: String,
    owner_email: String,
    owner_contact: String,
    vehicle_type: String,
    model: String,

    isAdmin: { type: Boolean, default: false },

    isVerified: { type: Boolean, default: false },
    verifyToken: String,
    verifyTokenExpiry: Date,
}, { timestamps: true });

export default mongoose.models.Vehicle ||
    mongoose.model("Vehicle", vehicleSchema);
