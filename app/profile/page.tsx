"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "./profile.module.css";
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
  notifications_enabled: boolean;
  isVerified: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
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
          setError(data.error || "Failed to fetch profile");
        }
      } catch (err) {
        setError("An error occurred while fetching profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.container}>
        <Header userName={userName} />
        <main className={styles.main}>
          <div className={styles.loading}>Loading profile...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !vehicleData) {
    return (
      <div className={styles.container}>
        <Header userName={userName} />
        <main className={styles.main}>
          <div className={styles.error}>{error || "Profile not found"}</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header userName={userName} />

      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <div className={styles.headerBadge}>Owner Profile</div>
          <h1>{vehicleData.owner_name}</h1>
          <p>{vehicleData.owner_email}</p>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Owner Information</h2>
            {vehicleData.isVerified && (
              <span className={styles.verifiedBadge}>Verified</span>
            )}
          </div>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Full Name</span>
              <span className={styles.value}>{vehicleData.owner_name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{vehicleData.owner_email}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Contact</span>
              <span className={styles.value}>{vehicleData.owner_contact}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Address</span>
              <span className={styles.value}>{vehicleData.owner_address}</span>
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <button className={styles.editButton} onClick={() => router.push("/services/update-details")}>
            Update Owner Info
          </button>
          <button className={styles.backButton} onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
