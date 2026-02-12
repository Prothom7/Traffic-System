"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "../services.module.css";
import { decodeJWTClient } from "@/helpers/jwtClient";

export default function RenewRegistrationPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [vehicleId, setVehicleId] = useState("");
  const [formData, setFormData] = useState({
    number_plate: "",
    registration_expiry: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    const decoded = decodeJWTClient(token);
    if (decoded?.name) setUserName(decoded.name);
    if (decoded?.id) setVehicleId(decoded.id);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/services/renew-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, vehicleId }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Registration renewed successfully!");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setMessage(data.error || "Failed to renew registration");
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
          <h1>Renew Vehicle Registration</h1>
          <p className={styles.subtitle}>Update your vehicle registration expiry date</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Number Plate</label>
              <input
                type="text"
                value={formData.number_plate}
                onChange={(e) => setFormData({ ...formData, number_plate: e.target.value.toUpperCase() })}
                placeholder="e.g., ABC-1234"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>New Registration Expiry Date</label>
              <input
                type="date"
                value={formData.registration_expiry}
                onChange={(e) => setFormData({ ...formData, registration_expiry: e.target.value })}
                required
              />
            </div>

            {message && (
              <div className={message.includes("success") ? styles.successMessage : styles.errorMessage}>
                {message}
              </div>
            )}

            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? "Processing..." : "Renew Registration"}
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
