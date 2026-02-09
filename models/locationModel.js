import mongoose from 'mongoose';

const EdgeSchema = new mongoose.Schema({
  to_location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  distance_km: { type: Number, required: true },
  travel_time_min: { type: Number },
  bidirectional: { type: Boolean, default: true }
});

const LocationSchema = new mongoose.Schema({
  location_name: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  edges: [EdgeSchema]
});

export default mongoose.models.Location || mongoose.model('Location', LocationSchema);
