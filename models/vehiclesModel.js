const mongoose = require('mongoose');
const { Schema } = mongoose;

const DriverAssignmentSchema = new Schema({
  driver_id: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
  assigned_from: { type: Date, required: true },
  assigned_to: { type: Date, default: null },
  driver_credit_score: { type: Number, default: 100 }
});

const VehicleSchema = new Schema({
  number_plate: { type: String, unique: true, required: true },
  owner_name: { type: String, required: true },
  owner_contact: { type: String },
  owner_address: { type: String },
  vehicle_type: { type: String },
  model: { type: String },
  year_of_manufacture: { type: Number },
  color: { type: String },
  engine_type: { type: String },
  chassis_number: { type: String, unique: true },
  registration_date: { type: Date },
  registration_expiry: { type: Date },
  credit_score: { type: Number },
  status: { type: String, default: 'Active' },
  drivers: [DriverAssignmentSchema]
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
