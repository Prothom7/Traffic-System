"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "./admin.module.css";
import "leaflet/dist/leaflet.css";

// Dynamically import Map to prevent SSR issues
const Map = dynamic(() => import("./map"), { ssr: false });

interface LocationMarker {
  name: string;
  latitude: number;
  longitude: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/admin/locations");
        const data = await response.json();
        setMarkers(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return (
    <div className={styles.fullpage}>
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
          <button className={styles.navButton}>Simulate Violation</button>
        </nav>
      </header>

      <main className={styles.container}>
        <h2 className={styles.sectionTitle}>Live Camera Location Map</h2>
        <div className={styles.mapWrapper} style={{ padding: "20px 0", height: "530px" }}>
          {loading ? <p>Loading map...</p> : <Map markers={markers} />}
        </div>
      </main>
    </div>
  );
}
