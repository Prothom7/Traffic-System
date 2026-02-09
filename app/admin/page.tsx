"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import styles from "./admin.module.css";
import AdminHeader from "./adminHeader";
import "leaflet/dist/leaflet.css";

// Dynamically import Map to prevent SSR issues
const Map = dynamic(() => import("./map"), { ssr: false });

interface LocationMarker {
  name: string;
  latitude: number;
  longitude: number;
}

export default function AdminDashboard() {
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
      <AdminHeader />

      <main className={styles.container}>
        <h2 className={styles.sectionTitle}>Live Camera Location Map</h2>
        <div className={styles.mapWrapper} style={{ padding: "20px 0", height: "530px" }}>
          {loading ? <p>Loading map...</p> : <Map markers={markers} />}
        </div>
      </main>
    </div>
  );
}
