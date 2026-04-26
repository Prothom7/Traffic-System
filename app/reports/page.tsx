"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "./reports.module.css";
import { decodeJWTClient, getValidAuthTokenClient } from "@/helpers/jwtClient";

const StolenTrackingMap = dynamic(() => import("./StolenTrackingMap"), { ssr: false });

interface VehicleData {
  _id?: string;
  number_plate: string;
  status: string;
}

interface UserData {
  _id: string;
  isAdmin?: boolean;
}

interface TrafficRecord {
  _id: string;
  date?: string;
  location_name?: string;
}

interface StolenReport {
  _id: string;
  status: "Stolen" | "Recovered" | "open" | "recovered";
  incident_location?: string;
  last_seen_location?: string;
  last_seen_time?: string;
  createdAt?: string;
  updatedAt?: string;
  reported_by_user_id?: {
    owner_name?: string;
    email?: string;
  };
  vehicleId?: {
    _id?: string;
    number_plate?: string;
    model?: string;
    vehicle_type?: string;
  };
}

interface TrackingPrediction {
  step: number;
  eta: string;
  latitude: number;
  longitude: number;
  estimated_speed_kmh: number;
}

interface TrackingData {
  current: {
    latitude: number;
    longitude: number;
    timestamp?: string;
    location_name?: string;
    speed_kmh?: number;
  } | null;
  predictions: TrackingPrediction[];
  history?: Array<{
    _id: string;
    latitude: number;
    longitude: number;
    timestamp?: string;
    location_name?: string;
  }>;
  adjacent_nodes?: Array<{
    location_id: string;
    location_name: string;
    latitude: number;
    longitude: number;
    distance_km: number;
  }>;
}

export default function ReportsPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("User");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [stolenReport, setStolenReport] = useState<StolenReport | null>(null);
  const [stolenReports, setStolenReports] = useState<StolenReport[]>([]);
  const [latestRecord, setLatestRecord] = useState<TrafficRecord | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const profileData = await profileRes.json();

        if (!profileData.success) {
          setError(profileData.error || "Failed to load report data");
          return;
        }

        const userData = profileData.data?.user as UserData;
        const vehicles = (profileData.data?.vehicles || []) as VehicleData[];
        const vehicleData = vehicles[0] || null;

        if (cancelled) return;

        setVehicle(vehicleData);
        setIsAdmin(!!userData?.isAdmin);

        const stolenRes = await fetch(
          `/api/services/report-stolen${userData?.isAdmin ? "?all=true" : ""}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const stolenData = await stolenRes.json();

        const stolenReports: StolenReport[] = Array.isArray(stolenData?.data)
          ? stolenData.data
          : [];

        setStolenReports(stolenReports);

        const activeStolen = stolenReports.find((report) =>
          ["Stolen", "open"].includes(String(report.status))
        ) || null;

        setStolenReport(activeStolen);

        if (vehicleData?.number_plate) {
          const fallbackLocation =
            activeStolen?.last_seen_location ||
            activeStolen?.incident_location ||
            "";

          const [recordRes, trackingRes] = await Promise.all([
            fetch(
              `/api/traffic-records?plate=${encodeURIComponent(
                vehicleData.number_plate
              )}`
            ),
            fetch(
              `/api/tracking/predict?plate=${encodeURIComponent(
                vehicleData.number_plate
              )}&points=8&stepMinutes=2&lastSeenLocation=${encodeURIComponent(
                fallbackLocation
              )}`
            ),
          ]);

          const recordData = await recordRes.json();
          const trackingData = await trackingRes.json();

          if (!cancelled) {
            if (Array.isArray(recordData) && recordData.length > 0) {
              setLatestRecord(recordData[0]);
            } else {
              setLatestRecord(null);
            }

            if (trackingData?.success && trackingData?.data) {
              setTracking(trackingData.data as TrackingData);
            } else {
              setTracking(null);
            }
          }
        }

      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("An error occurred while loading report data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    const interval = setInterval(fetchReport, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router]);

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  const timeAgo = (value?: string) => {
    if (!value) return "-";
    const diffMs = Date.now() - new Date(value).getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  };

  const normalizeTrackingStatus = (report: StolenReport) => {
    const status = String(report.status || "").toLowerCase();
    if (status === "recovered" || status === "closed") return "Recovered";

    const lastSeen = report.last_seen_time || report.updatedAt;
    if (lastSeen) {
      const diffMs = Date.now() - new Date(lastSeen).getTime();
      if (diffMs <= 15 * 60 * 1000) {
        return "Tracking";
      }
    }
    return "Stolen";
  };

  const reportVehicleOptions = Array.from(
    new Set(stolenReports.map((report) => report.vehicleId?.number_plate).filter(Boolean))
  ) as string[];

  const filteredReports = stolenReports.filter((report) => {
    if (vehicleFilter === "all") return true;
    return report.vehicleId?.number_plate === vehicleFilter;
  });

  const groupedByVehicle = filteredReports.reduce<Record<string, StolenReport[]>>((acc, report) => {
    const plate = report.vehicleId?.number_plate || "Unknown";
    if (!acc[plate]) {
      acc[plate] = [];
    }
    acc[plate].push(report);
    return acc;
  }, {});

  const isStolen = !!stolenReport && ["Stolen", "open"].includes(String(stolenReport.status));

  return (
    <div className={styles.container}>
      <Header userName={userName} />

      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <div className={styles.headerBadge}>Vehicle Reports</div>
          <h1>Reports</h1>
          <p>Track stolen vehicle status and recent sightings</p>
        </section>

        {loading && (
          <div className={styles.loading}>
            Loading report details...
          </div>
        )}

        {!loading && error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className={styles.grid}>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Stolen Vehicle Status</h2>

                <span
                  className={`${styles.statusBadge} ${
                    isStolen ? styles.statusAlert : ""
                  }`}
                >
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
                  Reported vehicle:{" "}
                  {stolenReport.vehicleId?.number_plate || "Unknown"}
                  {" "}at{" "}
                  {stolenReport.incident_location || "Unknown location"}
                </p>
              )}
            </section>


            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Last Seen</h2>
                <span className={styles.statusBadge}>
                  Latest Capture
                </span>
              </div>

              {latestRecord || stolenReport ? (
                <div className={styles.lastSeenGrid}>

                  <div>
                    <span className={styles.label}>Location</span>
                    <strong>
                      {stolenReport?.last_seen_location || latestRecord?.location_name || "Unknown location"}
                    </strong>
                  </div>

                  <div>
                    <span className={styles.label}>Last Seen</span>
                    <strong>
                      {stolenReport?.last_seen_location || "Unknown location"}
                    </strong>
                  </div>

                  <div>
                    <span className={styles.label}>Timestamp</span>
                    <strong>
                      {formatDateTime(stolenReport?.last_seen_time || latestRecord?.date)}
                    </strong>
                  </div>

                  <div>
                    <span className={styles.label}>Latest Capture</span>
                    <strong>{timeAgo(stolenReport?.last_seen_time || latestRecord?.date)}</strong>
                  </div>

                </div>
              ) : (
                <div className={styles.placeholder}>
                  No recent sightings recorded.
                </div>
              )}
            </section>


            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Live Tracking</h2>
                <span className={styles.statusBadge}>
                  {isStolen ? "Active" : "Standby"}
                </span>
              </div>

              <p>
                {isStolen
                  ? "Live stolen-vehicle tracking with predicted path is active and auto-refreshing."
                  : "Live tracking will activate when a stolen report is filed."}
              </p>

              <div className={styles.trackingPlaceholder}>
                <StolenTrackingMap
                  current={tracking?.current || null}
                  history={tracking?.history || []}
                  predictions={tracking?.predictions || []}
                  adjacentNodes={tracking?.adjacent_nodes || []}
                />
              </div>

              <button
                className={styles.trackButton}
                disabled={!isStolen}
              >
                {isStolen
                  ? "Tracking Active"
                  : "Tracking Disabled"}
              </button>

              {tracking?.predictions?.length ? (
                <p>
                  Predicted points: {tracking.predictions.length} | next ETA {formatDateTime(tracking.predictions[0]?.eta)}
                </p>
              ) : null}

              {tracking?.current ? (
                <p>
                  Current location: {tracking.current.location_name || "Unknown"} | Updated {timeAgo(tracking.current.timestamp)}
                </p>
              ) : null}

              {tracking?.history?.length ? (
                <p>
                  Movement history points: {tracking.history.length}
                </p>
              ) : null}

              {tracking?.adjacent_nodes?.length ? (
                <p>
                  Adjacent possible next nodes: {tracking.adjacent_nodes.map((node) => node.location_name).slice(0, 4).join(", ")}
                </p>
              ) : null}
            </section>


            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>All Reported Vehicles</h2>

                <span className={styles.statusBadge}>
                  {filteredReports.length} report(s)
                </span>
              </div>

              <div className={styles.filterRow}>
                <label htmlFor="vehicle-filter" className={styles.label}>Filter by Vehicle</label>
                <select
                  id="vehicle-filter"
                  className={styles.filterSelect}
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                >
                  <option value="all">All vehicles</option>
                  {reportVehicleOptions.map((plate) => (
                    <option key={plate} value={plate}>{plate}</option>
                  ))}
                </select>
              </div>

              {filteredReports.length === 0 ? (
                <div className={styles.placeholder}>
                  No reports found.
                </div>
              ) : (
                <div className={styles.reportHistoryList}>
                  {Object.entries(groupedByVehicle).map(([plate, items]) => {
                    const latest = items[0];
                    const isExpanded = expandedVehicle === plate;
                    return (
                      <div key={plate} className={styles.reportHistoryItem}>
                        <div className={styles.reportHistoryHeader}>
                          <div>
                            <span className={styles.label}>{plate}</span>
                            <strong>{normalizeTrackingStatus(latest)}</strong>
                            <div>
                              <small>
                                Last seen: {latest.last_seen_location || latest.incident_location || "Unknown"}
                              </small>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.historyToggle}
                            onClick={() => setExpandedVehicle(isExpanded ? null : plate)}
                          >
                            {isExpanded ? "Hide History" : "View Full History"}
                          </button>
                        </div>

                        {(isExpanded ? items : items.slice(0, 1)).map((report) => (
                          <div key={report._id} className={styles.reportHistoryEntry}>
                            <div><span className={styles.label}>Report Timestamp</span><strong>{formatDateTime(report.createdAt)}</strong></div>
                            <div><span className={styles.label}>Last Seen Location</span><strong>{report.last_seen_location || report.incident_location || "Unknown"}</strong></div>
                            <div><span className={styles.label}>Current Status</span><strong>{normalizeTrackingStatus(report)}</strong></div>
                            {isAdmin && report.reported_by_user_id?.owner_name ? (
                              <div><span className={styles.label}>Owner</span><strong>{report.reported_by_user_id.owner_name}</strong></div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    );
                  })}
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