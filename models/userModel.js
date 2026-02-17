// userModel.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    user_id: { type: Number, unique: true, index: true, required: true },
    owner_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    contact: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    credit_score: { type: Number, required: true, default: 100, min: 0 },
    isVerified: { type: Boolean, required: true, default: false },
    isAdmin: { type: Boolean, required: true, default: false },
    notifications_enabled: { type: Boolean, required: true, default: true },
    verifyToken: { type: String, required: true },
    verifyTokenExpiry: { type: Date, required: true },
  },
  { timestamps: true }
);

// Hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export model
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
