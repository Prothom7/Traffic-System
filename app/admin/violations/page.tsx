'use client';

import { useEffect, useState } from "react";
import styles from "./violations.module.css";
import AdminHeader from "../adminHeader";

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

  if (loading)
    return (
      <div className={styles.fullpage}>
        <AdminHeader />
        <main className={styles.container}>
          <p className={styles.loading}>Loading violations...</p>
        </main>
      </div>
    );

  if (error)
    return (
      <div className={styles.fullpage}>
        <AdminHeader />
        <main className={styles.container}>
          <p className={styles.error}>{error}</p>
        </main>
      </div>
    );

  return (
    <div className={styles.fullpage}>
      <AdminHeader />

      <main className={styles.container}>
        <h2 className={styles.sectionTitle}>Violation Records</h2>

        {violations.length === 0 ? (
          <p className={styles.empty}>No violations found.</p>
        ) : (
          <ul className={styles.violationsList}>
            {violations.map(v => (
              <li key={v._id} className={styles.violationItem}>
                <strong>{v.plate}</strong> — {v.type}{" "}
                <small>({new Date(v.date).toLocaleDateString()})</small>
                {v.severity && <div>Severity: {v.severity}</div>}
                {v.fine_amount !== undefined && <div>Fine: ${v.fine_amount}</div>}
                {v.status && <div>Status: {v.status}</div>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
