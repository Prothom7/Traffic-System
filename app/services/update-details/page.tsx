"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "../services.module.css";
import { decodeJWTClient, getValidAuthTokenClient } from "@/helpers/jwtClient";

type VehicleOption = {
  _id: string;
  number_plate: string;
  model: string;
};

export default function UpdateDetailsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [formData, setFormData] = useState({
    owner_contact: "",
    owner_address: "",
    color: "",
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = getValidAuthTokenClient();
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    const decoded = decodeJWTClient(token);
    if (decoded?.name) setUserName(decoded.name);

    const loadVehicles = async () => {
      try {
        const response = await fetch("/api/services/my-vehicles", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setVehicles(data.data || []);
          if (data.data?.[0]?.number_plate) {
            setSelectedPlate(data.data[0].number_plate);
          }
        }
      } catch (error) {
        setMessage("Failed to load your vehicles");
      } finally {
        setPageLoading(false);
      }
    };

    loadVehicles();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = getValidAuthTokenClient();
      if (!token) {
        router.push("/authentication/signin");
        return;
      }

      const response = await fetch(`/api/services/update-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          number_plate: selectedPlate,
          contact: formData.owner_contact,
          address: formData.owner_address,
          color: formData.color,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Details updated successfully!");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setMessage(data.error || "Failed to update details");
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
          <h1>Update Vehicle Details</h1>
          <p className={styles.subtitle}>Update your vehicle or owner information</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Select Your Vehicle</label>
              <select
                value={selectedPlate}
                onChange={(e) => setSelectedPlate(e.target.value)}
                disabled={pageLoading}
                required
              >
                <option value="">Choose a vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle.number_plate}>
                    {vehicle.number_plate} ({vehicle.model})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Contact Number</label>
              <input
                type="tel"
                value={formData.owner_contact}
                onChange={(e) => setFormData({ ...formData, owner_contact: e.target.value })}
                placeholder="Updated contact number"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Address</label>
              <textarea
                value={formData.owner_address}
                onChange={(e) => setFormData({ ...formData, owner_address: e.target.value })}
                placeholder="Updated address"
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Vehicle Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Updated vehicle color"
              />
            </div>

            {message && (
              <div className={message.includes("success") ? styles.successMessage : styles.errorMessage}>
                {message}
              </div>
            )}

            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.submitButton} disabled={loading || !selectedPlate}>
                {loading ? "Processing..." : "Update Details"}
              </button>
              <button type="button" className={styles.cancelButton} onClick={() => router.push("/explore")}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
