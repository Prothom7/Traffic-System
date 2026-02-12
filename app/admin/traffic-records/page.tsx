'use client';

import { useState } from "react";
import styles from "./trafficRecords.module.css";
import AdminHeader from "../adminHeader";

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
    <div className={styles.fullpage}>
      <AdminHeader />

      <main className={styles.container}>
        <h2 className={styles.sectionTitle}>Search Traffic Records</h2>

        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Enter number plate"
            value={plate}
            onChange={e => setPlate(e.target.value)}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchButton}>
            Search
          </button>
        </div>

        {loading && <p className={styles.loading}>Loading records...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && records.length === 0 && plate && (
          <p className={styles.noRecords}>No records found.</p>
        )}

        <ul className={styles.recordsList}>
          {records.map(r => (
            <li key={r._id} className={styles.recordItem}>
              <strong>{r.number_plate}</strong> — {r.violation_type || "No Violation"}
              {r.severity && ` | Severity: ${r.severity}`}
              {r.fine_amount !== undefined && ` | Fine: ${r.fine_amount}`}
              {r.status && ` | Status: ${r.status}`}
              <br />
              <small>({new Date(r.date).toLocaleDateString()})</small>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
