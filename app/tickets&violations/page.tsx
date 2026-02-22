"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "./tickets&violations.module.css";
import { decodeJWTClient } from "@/helpers/jwtClient";

interface VehicleData {
  _id: string;
  number_plate: string;
}

interface UserData {
  _id: string;
  credit_score: number;
}

interface TrafficRecord {
  _id: string;
  number_plate: string;
  violation_type?: string;
  severity?: string;
  fine_amount?: number;
  status?: string;
  date?: string;
  location_name?: string;
  paid_at?: string;
  payment_reference?: string;
}

export default function TicketsViolationsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [records, setRecords] = useState<TrafficRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("authToken");
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
          setError(profileData.error || "Failed to load vehicle data");
          setLoading(false);
          return;
        }

        const userData = profileData.data?.user as UserData | undefined;
        const userVehicles = (profileData.data?.vehicles || []) as VehicleData[];

        setCreditScore(typeof userData?.credit_score === "number" ? userData.credit_score : null);
        if (userVehicles.length === 0) {
          setRecords([]);
          setError("No vehicles found for this account.");
          setLoading(false);
          return;
        }

        const recordResponses = await Promise.all(
          userVehicles.map((v) =>
            fetch(`/api/traffic-records?plate=${encodeURIComponent(v.number_plate)}`)
          )
        );

        const recordPayloads = await Promise.all(recordResponses.map((res) => res.json()));
        const mergedRecords = recordPayloads
          .flatMap((payload) => (Array.isArray(payload) ? payload : []))
          .filter((item, index, self) => index === self.findIndex((r) => r._id === item._id));

        setRecords(mergedRecords);
      } catch (err) {
        setError("An error occurred while loading ticket history");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const { pendingTickets, paidTickets, totalViolations } = useMemo(() => {
    const tickets = records.filter((record) => record.violation_type);
    const pending = tickets.filter((record) => {
      const status = (record.status || "Pending").toLowerCase();
      return status !== "paid" && status !== "resolved";
    });
    const paid = tickets.filter((record) => {
      const status = (record.status || "Pending").toLowerCase();
      return status === "paid" || status === "resolved";
    });

    return {
      pendingTickets: pending,
      paidTickets: paid,
      totalViolations: tickets.length,
    };
  }, [records]);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  const handlePayNow = (ticket: TrafficRecord) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    const params = new URLSearchParams({
      amount: String(ticket.fine_amount ?? 0),
      type: ticket.violation_type || "Violation",
      status: ticket.status || "Pending",
      date: ticket.date || "",
      location: ticket.location_name || "Not recorded",
    });

    router.push(`/tickets&violation/payment/ticket/${ticket._id}?${params.toString()}`);
  };

  return (
    <div className={styles.container}>
      <Header userName={userName} />

      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <div className={styles.headerBadge}>Tickets & Violations</div>
          <h1>Tickets & Violations</h1>
          <p>Track your tickets, payment status, and driving credit score</p>
        </section>

        {loading && <div className={styles.loading}>Loading ticket history...</div>}
        {!loading && error && <div className={styles.error}>{error}</div>}

        {!loading && !error && (
          <>
            <section className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span>Total Violations</span>
                <strong>{totalViolations}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Pending Tickets</span>
                <strong>{pendingTickets.length}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Paid Tickets</span>
                <strong>{paidTickets.length}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Credit Score</span>
                <strong>{creditScore ?? "-"}</strong>
              </div>
            </section>

            <section className={styles.listSection}>
              <div className={styles.sectionHeader}>
                <h2>Current Tickets</h2>
                <span>{pendingTickets.length} active</span>
              </div>
              {pendingTickets.length === 0 ? (
                <div className={styles.placeholder}>No pending tickets right now.</div>
              ) : (
                <div className={styles.cardList}>
                  {pendingTickets.map((ticket) => (
                    <div key={ticket._id} className={styles.ticketCard}>
                      <div>
                        <h3>{ticket.violation_type || "Violation"}</h3>
                        <p>Severity: {ticket.severity || "-"}</p>
                        <p>Location: {ticket.location_name || "Not recorded"}</p>
                      </div>
                      <div className={styles.ticketMeta}>
                        <span>{formatDate(ticket.date)}</span>
                        <span className={styles.ticketStatus}>{ticket.status || "Pending"}</span>
                        <span className={styles.ticketFine}>Fine: {ticket.fine_amount ?? 0}</span>
                        <button
                          className={styles.payButton}
                          onClick={() => handlePayNow(ticket)}
                        >
                          Pay Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.listSection}>
              <div className={styles.sectionHeader}>
                <h2>Paid Tickets</h2>
                <span>{paidTickets.length} settled</span>
              </div>
              {paidTickets.length === 0 ? (
                <div className={styles.placeholder}>No paid tickets available.</div>
              ) : (
                <div className={styles.cardList}>
                  {paidTickets.map((ticket) => (
                    <div key={ticket._id} className={styles.ticketCard}>
                      <div>
                        <h3>{ticket.violation_type || "Violation"}</h3>
                        <p>Severity: {ticket.severity || "-"}</p>
                        <p>Location: {ticket.location_name || "Not recorded"}</p>
                      </div>
                      <div className={styles.ticketMeta}>
                        <span>{formatDate(ticket.date)}</span>
                        <span className={styles.ticketStatus}>{ticket.status || "Paid"}</span>
                        <span className={styles.ticketFine}>Fine: {ticket.fine_amount ?? 0}</span>
                        <span className={styles.paidMeta}>Paid: {formatDate(ticket.paid_at || ticket.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.listSection}>
              <div className={styles.sectionHeader}>
                <h2>Violation History</h2>
                <span>{totalViolations} recorded</span>
              </div>
              {totalViolations === 0 ? (
                <div className={styles.placeholder}>No violations recorded yet.</div>
              ) : (
                <div className={styles.cardList}>
                  {records.map((record) => (
                    <div key={record._id} className={styles.ticketCard}>
                      <div>
                        <h3>{record.violation_type || "Record"}</h3>
                        <p>Severity: {record.severity || "-"}</p>
                        <p>Location: {record.location_name || "Not recorded"}</p>
                      </div>
                      <div className={styles.ticketMeta}>
                        <span>{formatDate(record.date)}</span>
                        <span className={styles.ticketStatus}>{record.status || "Pending"}</span>
                        <span className={styles.ticketFine}>Fine: {record.fine_amount ?? 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.analyticsCard}>
              <h2>Analytics & Visual Insights</h2>
              <p>Reserved space for charts and visual breakdowns.</p>
              <div className={styles.analyticsPlaceholder}>
                <span>Chart area</span>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
