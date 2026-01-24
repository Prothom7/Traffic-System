'use client';

import { useState } from "react";

type TrafficRecord = {
  _id: string;
  number_plate: string;
  violation_type?: string;
  severity?: string;
  fine_amount?: number;
  status?: string;
  date: string;
};

export default function TrafficRecordsPage() {
  const [plate, setPlate] = useState("");
  const [records, setRecords] = useState<TrafficRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!plate) return;

    setLoading(true);
    setError("");
    setRecords([]);

    try {
      const res = await fetch(`/api/traffic-records?plate=${plate}`);
      if (!res.ok) throw new Error("Failed to fetch records");
      const data: TrafficRecord[] = await res.json();
      setRecords(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Traffic Records</h1>

      <input
        type="text"
        placeholder="Enter number plate"
        value={plate}
        onChange={e => setPlate(e.target.value)}
        style={{ padding: 8, marginRight: 8 }}
      />
      <button onClick={handleSearch} style={{ padding: 8 }}>Search</button>

      {loading && <p>Loading records...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && records.length === 0 && plate && <p>No records found.</p>}

      <ul>
        {records.map(r => (
          <li key={r._id}>
            {r.number_plate} — {r.violation_type || "No Violation"} 
            {r.severity && ` | Severity: ${r.severity}`}
            {r.fine_amount !== undefined && ` | Fine: ${r.fine_amount}`}
            {r.status && ` | Status: ${r.status}`}
            ({new Date(r.date).toLocaleDateString()})
          </li>
        ))}
      </ul>
    </div>
  );
}
