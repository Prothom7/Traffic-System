import mongoose from "mongoose";

const { Schema } = mongoose;

const ViolationSchema = new Schema({
  type: { type: String },
  severity: { type: String },
  fine_amount: { type: Number, default: 0 },
  status: { type: String, default: "Pending" },
  payment_method: { type: String },
  payment_reference: { type: String },
  gateway_transaction_id: { type: String },
  gateway_status: { type: String },
  paid_at: { type: Date },
  issued_by: { type: String },
  notes: { type: String },
});

const TrafficRecordSchema = new Schema({
  vehicle_id: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
  number_plate: { type: String },
  location_id: { type: Schema.Types.ObjectId, ref: "Location" },
  location: {
    location_name: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  timestamp: { type: Date, default: Date.now },
  speed: { type: Number },
  image_url: { type: String },
  violation: ViolationSchema,
});

const TrafficRecord = mongoose.models.TrafficRecord || mongoose.model("TrafficRecord", TrafficRecordSchema);

export default TrafficRecord;
