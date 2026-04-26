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

type StolenReport = {
  _id: string;
  incident_date: string;
  incident_location: string;
  createdAt: string;
  vehicleId?: {
    number_plate?: string;
    model?: string;
  };
};

export default function ReportStolenPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [reports, setReports] = useState<StolenReport[]>([]);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [formData, setFormData] = useState({
    incident_date: "",
    incident_location: "",
    police_report_number: "",
    additional_info: "",
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

    const bootstrap = async () => {
      try {
        const [vehicleRes, reportRes] = await Promise.all([
          fetch("/api/services/my-vehicles", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/services/report-stolen", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const vehicleData = await vehicleRes.json();
        const reportData = await reportRes.json();

        if (vehicleData.success) {
          const vehicleList = Array.isArray(vehicleData.data)
            ? vehicleData.data
            : [];
          const available = vehicleList.filter(
            (v: any) => String(v.status || "").toLowerCase() !== "stolen",
          );
          setVehicles(available);
          if (available?.[0]?.number_plate) {
            setSelectedPlate(available[0].number_plate);
          }
        }

        if (reportData.success) {
          setReports(reportData.data || []);
        }
      } catch (error) {
        setMessage("Failed to load stolen report data");
      } finally {
        setPageLoading(false);
      }
    };

    bootstrap();
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

      const response = await fetch(`/api/services/report-stolen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, number_plate: selectedPlate }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Vehicle reported as stolen successfully.");

        // Remove the reported vehicle from selectable options right away.
        setVehicles((prev) => {
          const remaining = prev.filter(
            (v) => v.number_plate !== selectedPlate,
          );
          setSelectedPlate(remaining[0]?.number_plate || "");
          return remaining;
        });

        const reportRes = await fetch("/api/services/report-stolen", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const reportData = await reportRes.json();
        if (reportData.success) {
          setReports(reportData.data || []);
        }
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
          <p className={styles.subtitle}>
            Report your vehicle as stolen to authorities
          </p>

          {pageLoading ? (
            <p className={styles.subtitle}>Loading your vehicles...</p>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Select Your Vehicle</label>
                <select
                  value={selectedPlate}
                  onChange={(e) => setSelectedPlate(e.target.value)}
                  required
                  className={styles.selectDropdown}
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
                <label>Incident Date</label>
                <input
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) =>
                    setFormData({ ...formData, incident_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Incident Location</label>
                <input
                  type="text"
                  value={formData.incident_location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      incident_location: e.target.value,
                    })
                  }
                  placeholder="Where was the vehicle stolen?"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Police Report Number (if available)</label>
                <input
                  type="text"
                  value={formData.police_report_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      police_report_number: e.target.value,
                    })
                  }
                  placeholder="Police report reference number"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Additional Information</label>
                <textarea
                  value={formData.additional_info}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additional_info: e.target.value,
                    })
                  }
                  placeholder="Any additional details about the incident"
                  rows={4}
                />
              </div>

              {message && (
                <div
                  className={
                    message.includes("success")
                      ? styles.successMessage
                      : styles.errorMessage
                  }
                >
                  {message}
                </div>
              )}

              <div className={styles.buttonGroup}>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading || !selectedPlate}
                >
                  {loading ? "Processing..." : "Report Stolen Vehicle"}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => router.push("/explore")}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className={styles.statusCard}>
            <h2>Your Stolen Vehicle Reports</h2>
            {reports.length === 0 ? (
              <p className={styles.subtitle}>
                No stolen reports submitted yet.
              </p>
            ) : (
              <div className={styles.listWrapper}>
                {reports.map((report) => (
                  <div key={report._id} className={styles.listItem}>
                    <strong>
                      {report.vehicleId?.number_plate || "Vehicle"}
                    </strong>
                    <span>
                      Incident:{" "}
                      {new Date(report.incident_date).toLocaleDateString()}
                    </span>
                    <span>Location: {report.incident_location}</span>
                    <span>
                      Reported at: {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
