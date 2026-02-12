"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "../services.module.css";
import { decodeJWTClient } from "@/helpers/jwtClient";

export default function ChangeOwnershipPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [vehicleId, setVehicleId] = useState("");
  const [formData, setFormData] = useState({
    number_plate: "",
    new_owner_name: "",
    new_owner_email: "",
    new_owner_contact: "",
    new_owner_address: "",
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
      const response = await fetch(`/api/services/change-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, vehicleId }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Ownership transfer request submitted successfully!");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setMessage(data.error || "Failed to submit ownership transfer");
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
          <h1>Change Vehicle Ownership</h1>
          <p className={styles.subtitle}>Transfer your vehicle to a new owner</p>

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
              <label>New Owner Name</label>
              <input
                type="text"
                value={formData.new_owner_name}
                onChange={(e) => setFormData({ ...formData, new_owner_name: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>New Owner Email</label>
              <input
                type="email"
                value={formData.new_owner_email}
                onChange={(e) => setFormData({ ...formData, new_owner_email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>New Owner Contact</label>
              <input
                type="tel"
                value={formData.new_owner_contact}
                onChange={(e) => setFormData({ ...formData, new_owner_contact: e.target.value })}
                placeholder="Phone number"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>New Owner Address</label>
              <textarea
                value={formData.new_owner_address}
                onChange={(e) => setFormData({ ...formData, new_owner_address: e.target.value })}
                placeholder="Full address"
                rows={3}
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
                {loading ? "Processing..." : "Submit Transfer Request"}
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
