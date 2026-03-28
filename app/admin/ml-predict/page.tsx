"use client";

import { useState } from "react";
import AdminHeader from "../adminHeader";
import styles from "./mlPredict.module.css";

const PREDICT_URL = process.env.NEXT_PUBLIC_ALPR_FASTAPI_URL || "http://localhost:8000/predict";

export default function MlPredictPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");

  const handlePredict = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setPlate("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(PREDICT_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "Prediction failed");
      }

      const predicted = String(data?.plate || "").trim();
      if (!predicted) {
        throw new Error("No plate text detected");
      }

      setPlate(predicted);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unexpected error while predicting");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <AdminHeader />
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>FastAPI Plate Prediction</h2>
          <p className={styles.subtitle}>Upload an image and run the Python ML pipeline on http://localhost:8000.</p>

          <input
            className={styles.fileInput}
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />

          <button className={styles.button} type="button" onClick={handlePredict} disabled={loading || !file}>
            {loading ? "Predicting..." : "Predict Plate"}
          </button>

          {plate && <div className={styles.result}>Predicted Plate: {plate}</div>}
          {error && <div className={styles.error}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
