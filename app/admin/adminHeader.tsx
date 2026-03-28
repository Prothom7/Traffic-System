"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "./adminHeader.module.css";

export default function AdminHeader() {
  const router = useRouter();

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Admin Dashboard</h1>
      <nav className={styles.nav}>
        <button onClick={() => router.push("/admin")} className={styles.navButton}>
          Camera Locations
        </button>
        <button onClick={() => router.push("/admin/addCamera")} className={styles.navButton}>
          Add Camera
        </button>
        <button onClick={() => router.push("/admin/vehicles")} className={styles.navButton}>
          Vehicles
        </button>
        <button
          onClick={() => router.push("/admin/traffic-records")}
          className={styles.navButton}
        >
          Traffic Records
        </button>
        <button onClick={() => router.push("/admin/violations")} className={styles.navButton}>
          Violations
        </button>
        <button onClick={() => router.push("/admin/UI")} className={styles.navButton}>
          UI
        </button>
        <button
          onClick={() => router.push("/admin/simulate-violation")}
          className={styles.navButton}
        >
          Simulate Violation
        </button>
        <button onClick={() => router.push("/admin/ml-predict")} className={styles.navButton}>
          ML Predict
        </button>
      </nav>
    </header>
  );
}
