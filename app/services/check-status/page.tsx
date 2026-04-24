"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "../services.module.css";
import { decodeJWTClient, getValidAuthTokenClient } from "@/helpers/jwtClient";

export default function CheckStatusPage() {
  type VehicleData = {
    number_plate: string;
    status: string;
    vehicle_type: string;
    model: string;
    registration_date: string;
    registration_expiry: string;
    credit_score: number;
  };
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [numberPlate, setNumberPlate] = useState("");
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = getValidAuthTokenClient();
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    const decoded = decodeJWTClient(token);
    if (decoded?.name) setUserName(decoded.name);
  }, [router]);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setVehicleData(null);

    try {
      const token = getValidAuthTokenClient();
      if (!token) {
        router.push("/authentication/signin");
        return;
      }

      const response = await fetch(
        `/api/services/check-status?number_plate=${numberPlate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setVehicleData(data.data);
      } else {
        setMessage(data.error || "Vehicle not found");
      }
    } catch (err) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Header userName={userName} />

      <main className={styles.main}>
        <div className={styles.formCard}>
          <h1>Check Vehicle Status</h1>
          <p className={styles.subtitle}>
            View your vehicle&apos;s current registration status
          </p>

          <form onSubmit={handleCheck} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Number Plate</label>
              <input
                type="text"
                value={numberPlate}
                onChange={(e) => setNumberPlate(e.target.value.toUpperCase())}
                placeholder="e.g., ABC-1234"
                required
              />
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Checking..." : "Check Status"}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => router.push("/explore")}
              >
                Back
              </button>
            </div>
          </form>

          {message && <div className={styles.errorMessage}>{message}</div>}

          {vehicleData && (
            <div className={styles.statusCard}>
              <h2>Vehicle Information</h2>
              <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Number Plate:</span>
                  <span className={styles.statusValue}>
                    {vehicleData.number_plate}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Status:</span>
                  <span
                    className={`${styles.statusValue} ${styles[vehicleData.status?.toLowerCase()]}`}
                  >
                    {vehicleData.status}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Vehicle Type:</span>
                  <span className={styles.statusValue}>
                    {vehicleData.vehicle_type}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Model:</span>
                  <span className={styles.statusValue}>
                    {vehicleData.model}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Registration Date:</span>
                  <span className={styles.statusValue}>
                    {new Date(
                      vehicleData.registration_date,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>
                    Registration Expiry:
                  </span>
                  <span className={styles.statusValue}>
                    {new Date(
                      vehicleData.registration_expiry,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Credit Score:</span>
                  <span className={styles.statusValue}>
                    {vehicleData.credit_score}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
