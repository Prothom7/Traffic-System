'use client';

import React from "react";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  return (
    <div className={styles.fullpage}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <nav className={styles.nav}>
          <button className={styles.navButton}>Vehicles</button>
          <button className={styles.navButton}>Drivers</button>
          <button className={styles.navButton}>Driver Assignments</button>
          <button className={styles.navButton}>Camera Locations</button>
          <button className={styles.navButton}>Traffic Records</button>
          <button className={styles.navButton}>Violations</button>
          <button className={styles.navButton}>Simulate Violation</button> 
        </nav>
      </header>

      <main className={styles.container}>
        <h2 className={styles.sectionTitle}>Live Camera Location Map</h2>
        <div className={styles.mapWrapper}>
          <iframe
            title="Camera Locations Map"
            width="100%"
            height="500"
            src="https://www.openstreetmap.org/export/embed.html?bbox=90.35%2C23.65%2C90.45%2C23.80&layer=mapnik"
          />
        </div>
      </main>
    </div>
  );
}
