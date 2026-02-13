"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "./myvehicle.module.css";
import { decodeJWTClient } from "@/helpers/jwtClient";

interface VehicleData {
  vehicle_id: number;
  number_plate: string;
  chassis_number: string;
  owner_name: string;
  owner_email: string;
  owner_contact: string;
  owner_address: string;
  credit_score: number;
  vehicle_type: string;
  model: string;
  year_of_manufacture: number;
  color: string;
  engine_type: string;
  registration_date: string;
  registration_expiry: string;
  status: string;
  isVerified: boolean;
}

export default function MyVehiclePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVehicle = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/authentication/signin");
        return;
      }

      const decoded = decodeJWTClient(token);
      if (decoded?.name) setUserName(decoded.name);

      try {
        const response = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          setVehicleData(data.data);
        } else {
          setError(data.error || "Failed to fetch vehicle data");
        }
      } catch (err) {
        setError("An error occurred while fetching vehicle data");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [router]);

  const formatDate = (value: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  return (
    <div className={styles.container}>
      <Header userName={userName} />

      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <div className={styles.headerBadge}>Vehicle Profile</div>
          <h1>My Vehicle</h1>
          <p>All essential details for your registered vehicle</p>
        </section>

        {loading && <div className={styles.loading}>Loading vehicle details...</div>}
        {!loading && error && <div className={styles.error}>{error}</div>}

        {!loading && !error && vehicleData && (
          <div className={styles.grid}>
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Overview</h2>
                <span className={styles.statusBadge}>{vehicleData.status}</span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Vehicle ID</span>
                  <span className={styles.value}>{vehicleData.vehicle_id}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Number Plate</span>
                  <span className={styles.value}>{vehicleData.number_plate}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Verification</span>
                  <span className={styles.value}>
                    {vehicleData.isVerified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Credit Score</span>
                  <span className={styles.value}>{vehicleData.credit_score}</span>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Specifications</h2>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Vehicle Type</span>
                  <span className={styles.value}>{vehicleData.vehicle_type}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Model</span>
                  <span className={styles.value}>{vehicleData.model}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Year</span>
                  <span className={styles.value}>{vehicleData.year_of_manufacture}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Color</span>
                  <span className={styles.value}>{vehicleData.color}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Engine Type</span>
                  <span className={styles.value}>{vehicleData.engine_type}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Chassis Number</span>
                  <span className={styles.value}>{vehicleData.chassis_number}</span>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Registration</h2>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Registered On</span>
                  <span className={styles.value}>{formatDate(vehicleData.registration_date)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Expiry Date</span>
                  <span className={styles.value}>{formatDate(vehicleData.registration_expiry)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Owner</span>
                  <span className={styles.value}>{vehicleData.owner_name}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Owner Email</span>
                  <span className={styles.value}>{vehicleData.owner_email}</span>
                </div>
              </div>
            </section>
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.backButton} onClick={() => router.push("/dashboard")}>Back to Dashboard</button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
