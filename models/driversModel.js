const mongoose = require('mongoose');
const { Schema } = mongoose;

const DriverSchema = new Schema({
  driver_name: { type: String, required: true },
  driver_license_no: { type: String, unique: true, required: true },
  license_type: { type: String },
  license_expiry: { type: Date },
  contact_number: { type: String },
  address: { type: String },
  credit_score: { type: Number, default: 100 }
});

module.exports = mongoose.model('Driver', DriverSchema);
