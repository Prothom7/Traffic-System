"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "./profile.module.css";
import { decodeJWTClient } from "@/helpers/jwtClient";

interface UserData {
  owner_name: string;
  email: string;
  contact: string;
  address: string;
  credit_score: number;
  isVerified: boolean;
  isAdmin: boolean;
}

interface VehicleData {
  _id: string;
  number_plate: string;
  chassis_number: string;
  vehicle_type: string;
  model: string;
  year_of_manufacture: number;
  color: string;
  engine_type: string;
  registration_date: string;
  registration_expiry: string;
  status: string;
  notifications_enabled: boolean;
  userId: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v._id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
    }
  };

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
          setUserData(data.data.user);
          setVehicles(data.data.vehicles);
          if (data.data.vehicles.length > 0) {
            setSelectedVehicle(data.data.vehicles[0]);
          }
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

  if (error || !userData) {
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
          <h1>{userData.owner_name}</h1>
          <p>{userData.email}</p>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Owner Information</h2>
            {userData.isVerified && (
              <span className={styles.verifiedBadge}>Verified</span>
            )}
          </div>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Full Name</span>
              <span className={styles.value}>{userData.owner_name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{userData.email}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Contact</span>
              <span className={styles.value}>{userData.contact}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Address</span>
              <span className={styles.value}>{userData.address}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Credit Score</span>
              <span className={styles.value}>{userData.credit_score}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Account Status</span>
              <span className={styles.value}>
                {userData.isAdmin ? "Admin" : "Regular User"}
              </span>
            </div>
          </div>
        </section>

        {vehicles.length > 0 && (
          <>
            <section className={styles.vehicleSelector}>
              <label className={styles.selectLabel}>Select Vehicle</label>
              <select
                className={styles.selectDropdown}
                value={selectedVehicle?._id || ""}
                onChange={(e) => handleVehicleChange(e.target.value)}
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.number_plate} - {vehicle.model}
                  </option>
                ))}
              </select>
            </section>

            {selectedVehicle && (
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>Vehicle Details</h2>
                  <span className={`${styles.statusLabel} ${styles[selectedVehicle.status]}`}>
                    {selectedVehicle.status.charAt(0).toUpperCase() +
                      selectedVehicle.status.slice(1)}
                  </span>
                </div>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Number Plate</span>
                    <span className={styles.value}>{selectedVehicle.number_plate}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Chassis Number</span>
                    <span className={styles.value}>{selectedVehicle.chassis_number}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Vehicle Type</span>
                    <span className={styles.value}>{selectedVehicle.vehicle_type}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Model</span>
                    <span className={styles.value}>{selectedVehicle.model}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Color</span>
                    <span className={styles.value}>{selectedVehicle.color}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Year of Manufacture</span>
                    <span className={styles.value}>{selectedVehicle.year_of_manufacture}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Engine Type</span>
                    <span className={styles.value}>{selectedVehicle.engine_type}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Registration Date</span>
                    <span className={styles.value}>
                      {new Date(selectedVehicle.registration_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Registration Expiry</span>
                    <span className={styles.value}>
                      {new Date(selectedVehicle.registration_expiry).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        <div className={styles.actions}>
          <button
            className={styles.editButton}
            onClick={() => router.push("/services/update-details")}
          >
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
