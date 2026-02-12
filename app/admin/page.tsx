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
        console.log("Fetched locations:", data);
        console.log("Number of locations:", data.length);
        
        if (data.error) {
          console.error("API returned error:", data.error);
          alert("Error: " + data.error);
        } else {
          setMarkers(data);
          if (data.length === 0) {
            console.warn("No camera locations found in database. Please add locations via 'Add Camera Location' page.");
          }
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        alert("Failed to fetch locations. Check console for details.");
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
        <div className={styles.mapWrapper}>
          {loading ? (
            <p>Loading map...</p>
          ) : markers.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <p style={{ fontSize: "18px", marginBottom: "10px" }}>No camera locations found in database.</p>
              <p style={{ fontSize: "14px", color: "#666" }}>
                Please add camera locations using the <a href="/admin/addCamera" style={{ color: "#0070f3" }}>Add Camera Location</a> page.
              </p>
            </div>
          ) : (
            <Map markers={markers} />
          )}
        </div>
      </main>
    </div>
  );
}
