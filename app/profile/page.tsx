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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return styles.statusActive;
      case "Expired":
        return styles.statusExpired;
      case "Stolen":
        return styles.statusStolen;
      case "Suspended":
        return styles.statusSuspended;
      default:
        return "";
    }
  };

  return (
    <div className={styles.container}>
      <Header userName={userName} />

      <main className={styles.main}>
        <div className={styles.profileHeader}>
          <div className={styles.profileIcon}>👤</div>
          <h1>{vehicleData.owner_name}</h1>
          <p className={styles.email}>{vehicleData.owner_email}</p>
          {vehicleData.isVerified && (
            <span className={styles.verifiedBadge}>✓ Verified</span>
          )}
        </div>

        <div className={styles.profileGrid}>
          {/* Owner Information */}
          <div className={styles.card}>
            <h2>Owner Information</h2>
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
          </div>

          {/* Vehicle Information */}
          <div className={styles.card}>
            <h2>Vehicle Information</h2>
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
                <span className={styles.label}>Chassis Number</span>
                <span className={styles.value}>{vehicleData.chassis_number}</span>
              </div>
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
            </div>
          </div>

          {/* Registration Information */}
          <div className={styles.card}>
            <h2>Registration Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Status</span>
                <span className={`${styles.value} ${getStatusColor(vehicleData.status)}`}>
                  {vehicleData.status}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Registration Date</span>
                <span className={styles.value}>
                  {new Date(vehicleData.registration_date).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Expiry Date</span>
                <span className={styles.value}>
                  {new Date(vehicleData.registration_expiry).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Credit Score</span>
                <span className={styles.value}>{vehicleData.credit_score}</span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className={styles.card}>
            <h2>Settings</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Notifications</span>
                <span className={styles.value}>
                  {vehicleData.notifications_enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Account Status</span>
                <span className={styles.value}>
                  {vehicleData.isVerified ? "Verified" : "Pending Verification"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.editButton} onClick={() => router.push("/services/update-details")}>
            Edit Profile
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
