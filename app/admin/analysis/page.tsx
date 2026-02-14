"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./analysis.module.css";

type ViolationRecord = {
  _id: { $oid: string };
  vehicle_id: { $oid: string };
  number_plate: string;
  timestamp: { $date: string };
  speed: number;
  violation: {
    type: string;
    severity: "Low" | "Medium" | "High";
    fine_amount: number;
    status: "Paid" | "Unpaid";
    issued_by: string;
    notes?: string;
  };
};

type AnalysisResponse = {
  records: ViolationRecord[];
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const getHour = (iso: string) => new Date(iso).getHours();

export default function AnalysisPage() {
  const [data, setData] = useState<ViolationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/analysis");
        if (!res.ok) throw new Error("Failed to load analysis data.");
        const json: AnalysisResponse = await res.json();
        if (mounted) setData(json.records || []);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const byHour: Record<number, number> = {};
    const byType: Record<string, number> = {};
    const byArea: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    data.forEach((r) => {
      const hour = getHour(r.timestamp.$date);
      byHour[hour] = (byHour[hour] || 0) + 1;
      byType[r.violation.type] = (byType[r.violation.type] || 0) + 1;
      byArea[r.violation.issued_by] = (byArea[r.violation.issued_by] || 0) + 1;
      bySeverity[r.violation.severity] =
        (bySeverity[r.violation.severity] || 0) + 1;
    });

    const topArea = Object.entries(byArea).sort((a, b) => b[1] - a[1])[0];
    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
    const topHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];

    return {
      byHour,
      byType,
      byArea,
      bySeverity,
      topArea,
      topType,
      topHour,
      total: data.length,
    };
  }, [data]);

  if (loading) {
    return <div className={styles.container}>Loading analysis…</div>;
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Traffic Violation Analysis</h1>
        <p>Insights on when violations happen, vulnerable areas, and top types.</p>
      </header>

      <section className={styles.kpis}>
        <div className={styles.kpi}>
          <h3>Total Violations</h3>
          <p>{totals.total}</p>
        </div>
        <div className={styles.kpi}>
          <h3>Most Vulnerable Area</h3>
          <p>{totals.topArea ? `${totals.topArea[0]} (${totals.topArea[1]})` : "—"}</p>
        </div>
        <div className={styles.kpi}>
          <h3>Most Common Type</h3>
          <p>{totals.topType ? `${totals.topType[0]} (${totals.topType[1]})` : "—"}</p>
        </div>
        <div className={styles.kpi}>
          <h3>Peak Hour</h3>
          <p>{totals.topHour ? `${totals.topHour[0]}:00 (${totals.topHour[1]})` : "—"}</p>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <h2>Violations by Hour</h2>
          <ul>
            {Object.entries(totals.byHour)
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([hour, count]) => (
                <li key={hour}>
                  <span>{hour}:00</span>
                  <span>{count}</span>
                </li>
              ))}
          </ul>
        </div>

        <div className={styles.card}>
          <h2>Violations by Type</h2>
          <ul>
            {Object.entries(totals.byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <li key={type}>
                  <span>{type}</span>
                  <span>{count}</span>
                </li>
              ))}
          </ul>
        </div>

        <div className={styles.card}>
          <h2>Vulnerable Areas</h2>
          <ul>
            {Object.entries(totals.byArea)
              .sort((a, b) => b[1] - a[1])
              .map(([area, count]) => (
                <li key={area}>
                  <span>{area}</span>
                  <span>{count}</span>
                </li>
              ))}
          </ul>
        </div>

        <div className={styles.card}>
          <h2>Severity Distribution</h2>
          <ul>
            {Object.entries(totals.bySeverity)
              .sort((a, b) => b[1] - a[1])
              .map(([sev, count]) => (
                <li key={sev}>
                  <span>{sev}</span>
                  <span>{count}</span>
                </li>
              ))}
          </ul>
        </div>
      </section>

      <section className={styles.tableWrap}>
        <h2>Recent Violations</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Plate</th>
              <th>Time</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Area</th>
              <th>Speed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r._id.$oid}>
                <td>{r.number_plate}</td>
                <td>{formatDate(r.timestamp.$date)}</td>
                <td>{r.violation.type}</td>
                <td>{r.violation.severity}</td>
                <td>{r.violation.issued_by}</td>
                <td>{r.speed} km/h</td>
                <td>{r.violation.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}