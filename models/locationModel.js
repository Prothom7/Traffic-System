const mongoose = require('mongoose');
const { Schema } = mongoose;

const EdgeSchema = new Schema({
  to_location_id: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  distance_km: { type: Number, required: true },
  travel_time_min: { type: Number },
  bidirectional: { type: Boolean, default: true }
});

const LocationSchema = new Schema({
  location_name: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  edges: [EdgeSchema]
});

module.exports = mongoose.model('Location', LocationSchema);
