'use client';

import { useState } from "react";

const records = [
  { plate: "DHAKA-1234", violation: "Speeding" },
  { plate: "DHAKA-1234", violation: "Red Light Jump" },
  { plate: "CTG-5678", violation: "Illegal Parking" },
];

export default function TrafficRecordsPage() {
  const [query, setQuery] = useState("");
  const results = records.filter(r =>
    r.plate.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Traffic Records Search</h1>

      <input
        type="text"
        placeholder="Enter vehicle plate"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ padding: 8, marginBottom: 10 }}
      />

      <ul>
        {results.map((r, i) => (
          <li key={i}>{r.plate} — {r.violation}</li>
        ))}
      </ul>
    </div>
  );
}
