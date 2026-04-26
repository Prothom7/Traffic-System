'use client';

import { useState } from "react";
import styles from "./simulateViolation.module.css";
import AdminHeader from "../adminHeader";

const violationOptions = [
  "Speeding",
  "Red Light",
  "Wrong Lane",
  "Illegal Parking",
  "No Helmet",
  "No Seatbelt",
  "Other",
];

const severityOptions = ["Low", "Medium", "High", "Critical"];

export default function SimulateViolationPage() {
  const [form, setForm] = useState({
    number_plate: "",
    violation_type: violationOptions[0],
    cause: "",
    camera_location: "",
    severity: severityOptions[0],
    fine_amount: "",
  });

  const [loading, setLoading] = useState(false);
  const [extractingPlate, setExtractingPlate] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showPlatePopup, setShowPlatePopup] = useState(false);
  const [lastExtractedPlate, setLastExtractedPlate] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.number_plate.trim()) {
      setError("Please upload an image and extract the license plate before simulating.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        number_plate: form.number_plate,
        violation_type: form.violation_type,
        cause: form.cause,
        camera_location: form.camera_location,
        severity: form.severity,
        fine_amount: form.fine_amount ? Number(form.fine_amount) : 0,
      };

      const res = await fetch("/api/admin/violations/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to simulate violation");
      }

      const notice = data.notificationsEnabled
        ? "Notification sent to the vehicle owner."
        : "Notifications are disabled for this vehicle.";

      setSuccess(`Violation simulated. ${notice}`);
      setForm((prev) => ({
        ...prev,
        number_plate: "",
        cause: "",
        camera_location: "",
        fine_amount: "",
      }));
      setSelectedImage(null);
      setLastExtractedPlate("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedImage(file);
    if (file) {
      setForm((prev) => ({ ...prev, number_plate: "" }));
      setLastExtractedPlate("");
    }
  };

  const handleExtractPlate = async () => {
    if (!selectedImage) {
      setError("Please choose an image first");
      return;
    }

    setExtractingPlate(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const res = await fetch("/api/admin/violations/extract-plate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to extract plate");
      }

      const extractedPlate = String(data?.plate || "").trim();
      if (!extractedPlate) {
        throw new Error("No plate text was detected in this image");
      }

      setForm((prev) => ({ ...prev, number_plate: extractedPlate }));
      setLastExtractedPlate(extractedPlate);
      setShowPlatePopup(true);
      setSuccess(`Plate extracted: ${extractedPlate}`);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || "Something went wrong while extracting plate");
      } else {
        setError("Something went wrong while extracting plate");
      }
    } finally {
      setExtractingPlate(false);
    }
  };

  return (
    <div className={styles.fullpage}>
      <AdminHeader />

      <main className={styles.container}>
        <h2 className={styles.sectionTitle}>Simulate Violation Event</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={`${styles.inputGroup} ${styles.fullRow}`}>
              <label className={styles.label} htmlFor="plate_image">
                Upload Car Image (for auto plate extraction)
              </label>
              <div className={styles.uploadRow}>
                <input
                  id="plate_image"
                  name="plate_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className={styles.fileInput}
                />
                <button
                  type="button"
                  onClick={handleExtractPlate}
                  disabled={extractingPlate || !selectedImage}
                  className={styles.extractButton}
                >
                  {extractingPlate ? "Extracting..." : "Extract Plate"}
                </button>
              </div>
              {form.number_plate && (
                <p className={styles.extractedPreview}>
                  Extracted plate: <strong>{form.number_plate}</strong>
                </p>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="violation_type">
                Violation Type
              </label>
              <select
                id="violation_type"
                name="violation_type"
                value={form.violation_type}
                onChange={handleChange}
                className={styles.select}
              >
                {violationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="severity">
                Severity
              </label>
              <select
                id="severity"
                name="severity"
                value={form.severity}
                onChange={handleChange}
                className={styles.select}
              >
                {severityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="fine_amount">
                Fine Amount (optional)
              </label>
              <input
                id="fine_amount"
                name="fine_amount"
                type="number"
                min={0}
                step={1}
                value={form.fine_amount}
                onChange={handleChange}
                className={styles.input}
                placeholder="0"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="camera_location">
                Camera Location
              </label>
              <input
                id="camera_location"
                name="camera_location"
                type="text"
                required
                value={form.camera_location}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g., Main St & 5th Ave"
              />
            </div>

            <div className={`${styles.inputGroup} ${styles.fullRow}`}>
              <label className={styles.label} htmlFor="cause">
                Cause of Violation
              </label>
              <textarea
                id="cause"
                name="cause"
                required
                value={form.cause}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="Describe the cause of the violation"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.submitButton}
              type="submit"
              disabled={loading || !form.number_plate.trim()}
            >
              {loading ? "Sending..." : "Simulate Event"}
            </button>
          </div>
        </form>

        {(success || error) && (
          <p className={`${styles.status} ${success ? styles.success : styles.error}`}>
            {success || error}
          </p>
        )}
      </main>

      {showPlatePopup && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>License Plate Extracted</h3>
            <p className={styles.modalPlate}>{lastExtractedPlate}</p>
            <button
              type="button"
              className={styles.modalButton}
              onClick={() => setShowPlatePopup(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
