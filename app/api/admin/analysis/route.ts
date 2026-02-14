import { NextResponse } from "next/server";

const sampleData = [
  {
    _id: { $oid: "697494a0f7c428ad45ffef6b" },
    vehicle_id: { $oid: "6974939cf7c428ad45ffef60" },
    number_plate: "CTG-5678",
    timestamp: { $date: "2026-01-21T14:45:00.000Z" },
    speed: 60,
    violation: {
      type: "Red Light Jump",
      severity: "Medium",
      fine_amount: 2000,
      status: "Paid",
      issued_by: "Camera 03",
      notes: "Crossed red light at junction",
    },
  },
  {
    _id: { $oid: "697494a0f7c428ad45ffef6c" },
    vehicle_id: { $oid: "6974939cf7c428ad45ffef61" },
    number_plate: "DHA-1123",
    timestamp: { $date: "2026-01-21T09:10:00.000Z" },
    speed: 72,
    violation: {
      type: "Speeding",
      severity: "High",
      fine_amount: 4000,
      status: "Unpaid",
      issued_by: "Camera 05",
      notes: "Over speed limit by 20 km/h",
    },
  },
  {
    _id: { $oid: "697494a0f7c428ad45ffef6d" },
    vehicle_id: { $oid: "6974939cf7c428ad45ffef62" },
    number_plate: "CTG-9981",
    timestamp: { $date: "2026-01-21T18:30:00.000Z" },
    speed: 55,
    violation: {
      type: "Wrong Way",
      severity: "Medium",
      fine_amount: 2500,
      status: "Paid",
      issued_by: "Camera 02",
      notes: "Entered wrong lane",
    },
  },
  {
    _id: { $oid: "697494a0f7c428ad45ffef6e" },
    vehicle_id: { $oid: "6974939cf7c428ad45ffef63" },
    number_plate: "DHA-3322",
    timestamp: { $date: "2026-01-22T14:05:00.000Z" },
    speed: 48,
    violation: {
      type: "Red Light Jump",
      severity: "Medium",
      fine_amount: 2000,
      status: "Paid",
      issued_by: "Camera 03",
      notes: "Late braking at junction",
    },
  },
];

export async function GET() {
  return NextResponse.json({ records: sampleData });
}