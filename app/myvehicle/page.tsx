"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "./myvehicle.module.css";
import { decodeJWTClient, getValidAuthTokenClient } from "@/helpers/jwtClient";

interface VehicleData {
  _id: string;
  vehicle_id: number;
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

interface UserData {
  _id: string;
  owner_name: string;
  email: string;
  contact: string;
  address: string;
  credit_score: number;
  isVerified: boolean;
  isAdmin: boolean;
}

export default function MyVehiclePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = getValidAuthTokenClient();
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
        if (data.success && data.data) {
          setUserData(data.data.user);
          const vehicleList: VehicleData[] = data.data.vehicles || [];
          setVehicles(vehicleList);
          if (vehicleList.length > 0) {
            setSelectedVehicle(vehicleList[0]);
          }
        } else {
          setError(data.error || "Failed to fetch data");
        }
      } catch (err) {
        setError("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const formatDate = (value: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v._id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
    }
  };

  return (
    <div className={styles.container}>
      <Header userName={userName} />

      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <div className={styles.headerBadge}>Vehicle Profile</div>
          <h1>My Vehicles</h1>
          <p>All essential details for your registered vehicles</p>
        </section>

        {loading && <div className={styles.loading}>Loading vehicle details...</div>}
        {!loading && error && <div className={styles.error}>{error}</div>}
        {!loading && vehicles.length === 0 && <div className={styles.error}>No vehicles registered. Add one in the Explore page.</div>}

        {!loading && !error && vehicles.length > 0 && selectedVehicle && (
          <div>
            {/* Vehicle Selector */}
            <div className={styles.vehicleSelector}>
              <label>Select Vehicle:</label>
              <select 
                value={selectedVehicle._id} 
                onChange={(e) => handleVehicleChange(e.target.value)}
                className={styles.selectDropdown}
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.number_plate} - {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.grid}>
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>Overview</h2>
                  <span className={styles.statusBadge}>{selectedVehicle.status}</span>
                </div>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Vehicle ID</span>
                    <span className={styles.value}>{selectedVehicle.vehicle_id}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Number Plate</span>
                    <span className={styles.value}>{selectedVehicle.number_plate}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Status</span>
                    <span className={styles.value}>
                      <span className={`${styles.statusLabel} ${styles[selectedVehicle.status.toLowerCase()]}`}>
                        {selectedVehicle.status}
                      </span>
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Notifications</span>
                    <span className={styles.value}>{selectedVehicle.notifications_enabled ? "Enabled" : "Disabled"}</span>
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
                    <span className={styles.value}>{selectedVehicle.vehicle_type}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Model</span>
                    <span className={styles.value}>{selectedVehicle.model}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Year</span>
                    <span className={styles.value}>{selectedVehicle.year_of_manufacture}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Color</span>
                    <span className={styles.value}>{selectedVehicle.color}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Engine Type</span>
                    <span className={styles.value}>{selectedVehicle.engine_type}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Chassis Number</span>
                    <span className={styles.value}>{selectedVehicle.chassis_number}</span>
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
                    <span className={styles.value}>{formatDate(selectedVehicle.registration_date)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Expiry Date</span>
                    <span className={styles.value}>{formatDate(selectedVehicle.registration_expiry)}</span>
                  </div>
                </div>
              </section>

              {userData && (
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2>Owner Information</h2>
                  </div>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Name</span>
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
                      <span className={styles.label}>Verified</span>
                      <span className={styles.value}>{userData.isVerified ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </section>
              )}
            </div>
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
