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

type OwnershipRequest = {
  _id: string;
  status: "pending" | "approved" | "rejected";
  new_owner_email: string;
  createdAt: string;
  vehicleId?: {
    number_plate?: string;
    model?: string;
  };
};

export default function ChangeOwnershipPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [requests, setRequests] = useState<OwnershipRequest[]>([]);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [formData, setFormData] = useState({
    new_owner_name: "",
    new_owner_email: "",
    new_owner_contact: "",
    new_owner_address: "",
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
        const [vehicleRes, requestRes] = await Promise.all([
          fetch("/api/services/my-vehicles", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/services/change-ownership", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const vehicleData = await vehicleRes.json();
        const requestData = await requestRes.json();

        if (vehicleData.success) {
          setVehicles(vehicleData.data || []);
          if (vehicleData.data?.[0]?.number_plate) {
            setSelectedPlate(vehicleData.data[0].number_plate);
          }
        }

        if (requestData.success) {
          setRequests(requestData.data || []);
        }
      } catch (error) {
        setMessage("Failed to load ownership data");
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

      const response = await fetch(`/api/services/change-ownership`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, number_plate: selectedPlate }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(
          "Ownership transfer request submitted and pending admin approval.",
        );
        const requestRes = await fetch("/api/services/change-ownership", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const requestData = await requestRes.json();
        if (requestData.success) {
          setRequests(requestData.data || []);
        }
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
          <p className={styles.subtitle}>
            Transfer your vehicle to a new owner
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
                <label>New Owner Name</label>
                <input
                  type="text"
                  value={formData.new_owner_name}
                  onChange={(e) =>
                    setFormData({ ...formData, new_owner_name: e.target.value })
                  }
                  placeholder="Full name"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>New Owner Email</label>
                <input
                  type="email"
                  value={formData.new_owner_email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      new_owner_email: e.target.value,
                    })
                  }
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>New Owner Contact</label>
                <input
                  type="tel"
                  value={formData.new_owner_contact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      new_owner_contact: e.target.value,
                    })
                  }
                  placeholder="Phone number"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>New Owner Address</label>
                <textarea
                  value={formData.new_owner_address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      new_owner_address: e.target.value,
                    })
                  }
                  placeholder="Full address"
                  rows={3}
                  required
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
                  {loading ? "Processing..." : "Submit Transfer Request"}
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
            <h2>Your Ownership Requests</h2>
            {requests.length === 0 ? (
              <p className={styles.subtitle}>
                No ownership requests submitted yet.
              </p>
            ) : (
              <div className={styles.listWrapper}>
                {requests.map((request) => (
                  <div key={request._id} className={styles.listItem}>
                    <strong>
                      {request.vehicleId?.number_plate || "Vehicle"}
                    </strong>
                    <span>Status: {request.status}</span>
                    <span>New Owner: {request.new_owner_email}</span>
                    <span>
                      Requested at:{" "}
                      {new Date(request.createdAt).toLocaleString()}
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
