'use client';

const violations = [
  { id: 1, plate: "DHAKA-1234", type: "Speeding", date: "2026-01-20" },
  { id: 2, plate: "CTG-5678", type: "Red Light Jump", date: "2026-01-21" },
];

export default function ViolationsPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Recent Violations</h1>

      <ul>
        {violations.map(v => (
          <li key={v.id}>
             {v.plate} — {v.type} ({v.date})
          </li>
        ))}
      </ul>
    </div>
  );
}
