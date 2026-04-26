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

interface UserData {
  _id: string;
  isAdmin?: boolean;
}

interface ReportItem {
  _id: string;
  reason: string;
  status: "Pending" | "Investigating" | "Resolved";
  createdAt: string;
  user_id?: {
    owner_name?: string;
    email?: string;
  };
  vehicle_id?: {
    number_plate?: string;
    model?: string;
    vehicle_type?: string;
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
  const [latestRecord, setLatestRecord] = useState<TrafficRecord | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
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
        const profileRes = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        if (!profileData.success) {
          setError(profileData.error || "Failed to load report data");
          setLoading(false);
          return;
        }

        const userData = profileData.data?.user as UserData | undefined;
        const vehicles = (profileData.data?.vehicles || []) as VehicleData[];
        const vehicleData = vehicles[0] || null;

        setIsAdmin(Boolean(userData?.isAdmin));
        setVehicle(vehicleData);

        const reportsRes = await fetch(
          `/api/reports?mine=${userData?.isAdmin ? "false" : "true"}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const reportsData = await reportsRes.json();
        if (reportsData?.success && Array.isArray(reportsData.data)) {
          setReports(reportsData.data);
        }

        if (vehicleData?.number_plate) {
          const recordRes = await fetch(
            `/api/traffic-records?plate=${encodeURIComponent(vehicleData.number_plate)}`
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

  const isStolen = vehicle?.status === "Stolen";

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

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>{isAdmin ? "All Reported Vehicles" : "My Reports"}</h2>
                <span className={styles.statusBadge}>{reports.length} report(s)</span>
              </div>
              {reports.length === 0 ? (
                <div className={styles.placeholder}>No reports found.</div>
              ) : (
                <div className={styles.lastSeenGrid}>
                  {reports.slice(0, 8).map((report) => (
                    <div key={report._id}>
                      <span className={styles.label}>
                        {report.vehicle_id?.number_plate || "Unknown plate"}
                      </span>
                      <strong>{report.reason}</strong>
                      <div>
                        <small>
                          {report.status} | {formatDateTime(report.createdAt)}
                          {isAdmin && report.user_id?.owner_name
                            ? ` | ${report.user_id.owner_name}`
                            : ""}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
