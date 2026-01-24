'use client';

import { useEffect, useState } from "react";

type Violation = {
  _id: string;
  plate: string;
  type: string;
  severity?: string;
  fine_amount?: number;
  status?: string;
  issued_by?: string;
  notes?: string;
  date: string;
};

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchViolations() {
      try {
        const res = await fetch("/api/violations");
        if (!res.ok) throw new Error("Failed to fetch violations");
        const data: Violation[] = await res.json();
        setViolations(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchViolations();
  }, []);

  if (loading) return <p style={{ padding: 20 }}>Loading violations...</p>;
  if (error) return <p style={{ padding: 20, color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Recent Violations</h1>

      {violations.length === 0 ? (
        <p>No violations found.</p>
      ) : (
        <ul>
          {violations.map(v => (
            <li key={v._id}>
              {v.plate} — {v.type} ({new Date(v.date).toLocaleDateString()})
              {v.severity && ` | Severity: ${v.severity}`}
              {v.fine_amount !== undefined && ` | Fine: ${v.fine_amount}`}
              {v.status && ` | Status: ${v.status}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
