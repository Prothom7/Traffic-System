"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "../services.module.css";
import { decodeJWTClient } from "@/helpers/jwtClient";

export default function ReportStolenPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [vehicleId, setVehicleId] = useState("");
  const [formData, setFormData] = useState({
    number_plate: "",
    incident_date: "",
    incident_location: "",
    police_report_number: "",
    additional_info: "",
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
      const response = await fetch(`/api/services/report-stolen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, vehicleId }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Vehicle reported as stolen successfully!");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setMessage(data.error || "Failed to report stolen vehicle");
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
          <h1>Report Stolen Vehicle</h1>
          <p className={styles.subtitle}>Report your vehicle as stolen to authorities</p>

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
              <label>Incident Date</label>
              <input
                type="date"
                value={formData.incident_date}
                onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Incident Location</label>
              <input
                type="text"
                value={formData.incident_location}
                onChange={(e) => setFormData({ ...formData, incident_location: e.target.value })}
                placeholder="Where was the vehicle stolen?"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Police Report Number (if available)</label>
              <input
                type="text"
                value={formData.police_report_number}
                onChange={(e) => setFormData({ ...formData, police_report_number: e.target.value })}
                placeholder="Police report reference number"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Additional Information</label>
              <textarea
                value={formData.additional_info}
                onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                placeholder="Any additional details about the incident"
                rows={4}
              />
            </div>

            {message && (
              <div className={message.includes("success") ? styles.successMessage : styles.errorMessage}>
                {message}
              </div>
            )}

            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? "Processing..." : "Report Stolen Vehicle"}
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
