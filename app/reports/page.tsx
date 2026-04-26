"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "./reports.module.css";
import { decodeJWTClient, getValidAuthTokenClient } from "@/helpers/jwtClient";

interface VehicleData {
  _id?: string;
  number_plate: string;
  status: string;
}

interface ProfileData {
  user?: {
    owner_name?: string;
    email?: string;
  };
  vehicles?: VehicleData[];
}

interface StolenReport {
  _id: string;
  status: "open" | "recovered";
  incident_date?: string;
  incident_location?: string;
  createdAt?: string;
  vehicleId?: {
    _id?: string;
    number_plate?: string;
    model?: string;
    status?: string;
  };
}

interface TrafficRecord {
  _id: string;
  date?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  image_url?: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [stolenReport, setStolenReport] = useState<StolenReport | null>(null);
  const [latestRecord, setLatestRecord] = useState<TrafficRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      const token = getValidAuthTokenClient();
      if (!token) {
        router.push("/authentication/signin");
        return;
      }

      const decoded = decodeJWTClient(token);
      if (decoded?.name) setUserName(decoded.name);

      try {
        const [profileRes, stolenRes] = await Promise.all([
          fetch("/api/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/services/report-stolen", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profileData = await profileRes.json();
        const stolenData = await stolenRes.json();

        if (!profileData.success) {
          setError(profileData.error || "Failed to load report data");
          setLoading(false);
          return;
        }

        const profile = (profileData.data || {}) as ProfileData;
        const vehicles = Array.isArray(profile.vehicles) ? profile.vehicles : [];

        const reports = Array.isArray(stolenData.data)
          ? (stolenData.data as StolenReport[])
          : [];
        const activeReport = reports.find((report) => report.status === "open") || null;
        setStolenReport(activeReport);

        const trackedPlate = activeReport?.vehicleId?.number_plate;
        const selectedVehicle = trackedPlate
          ? vehicles.find((v) => v.number_plate === trackedPlate) || null
          : vehicles[0] || null;

        setVehicle(selectedVehicle);

        if (selectedVehicle?.number_plate) {
          const recordRes = await fetch(
            `/api/traffic-records?plate=${encodeURIComponent(selectedVehicle.number_plate)}`
          );
          const recordData = await recordRes.json();
          if (Array.isArray(recordData) && recordData.length > 0) {
            setLatestRecord(recordData[0]);
          }
        }
      } catch (err) {
        setError("An error occurred while loading report data");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [router]);

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  const isStolen = Boolean(stolenReport && stolenReport.status === "open");

  return (
    <div className={styles.container}>
      <Header userName={userName} />

      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <div className={styles.headerBadge}>Vehicle Reports</div>
          <h1>Reports</h1>
          <p>Track stolen vehicle status and recent sightings</p>
        </section>

        {loading && <div className={styles.loading}>Loading report details...</div>}
        {!loading && error && <div className={styles.error}>{error}</div>}

        {!loading && !error && (
          <div className={styles.grid}>
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Stolen Vehicle Status</h2>
                <span className={`${styles.statusBadge} ${isStolen ? styles.statusAlert : ""}`}>
                  {isStolen ? "Reported" : "Not Reported"}
                </span>
              </div>
              <p>
                {isStolen
                  ? "Your vehicle has been marked as stolen. Authorities are monitoring recent sightings."
                  : "No active stolen vehicle report is on record."}
              </p>
              {isStolen && stolenReport && (
                <p>
                  Reported vehicle: {stolenReport.vehicleId?.number_plate || "Unknown"} at {stolenReport.incident_location || "Unknown location"}
                </p>
              )}
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Last Seen</h2>
                <span className={styles.statusBadge}>Latest Capture</span>
              </div>
              {latestRecord ? (
                <div className={styles.lastSeenGrid}>
                  <div>
                    <span className={styles.label}>Location</span>
                    <strong>{latestRecord.location_name || "Unknown location"}</strong>
                  </div>
                  <div>
                    <span className={styles.label}>Timestamp</span>
                    <strong>{formatDateTime(latestRecord.date)}</strong>
                  </div>
                  <div>
                    <span className={styles.label}>Speed</span>
                    <strong>{latestRecord.speed ? `${latestRecord.speed} km/h` : "-"}</strong>
                  </div>
                  <div>
                    <span className={styles.label}>Coordinates</span>
                    <strong>
                      {latestRecord.latitude && latestRecord.longitude
                        ? `${latestRecord.latitude}, ${latestRecord.longitude}`
                        : "-"}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className={styles.placeholder}>No recent sightings recorded.</div>
              )}
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Live Tracking</h2>
                <span className={styles.statusBadge}>Coming Soon</span>
              </div>
              <p>
                {isStolen
                  ? "Enable live tracking to follow the vehicle in real time once sensors are active."
                  : "Live tracking will activate when a stolen report is filed."}
              </p>
              <div className={styles.trackingPlaceholder}>
                <span>Live map placeholder</span>
              </div>
              <button className={styles.trackButton} disabled={!isStolen}>
                {isStolen ? "Start Live Tracking" : "Tracking Disabled"}
              </button>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
