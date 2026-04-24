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
  registration_expiry: string;
  months_remaining: number;
  days_remaining: number;
  eligible_for_renewal: boolean;
  renewal_message: string;
};

type RenewalRequest = {
  _id: string;
  status: "pending" | "approved" | "rejected";
  payment_status: "not_required" | "pending" | "success" | "failed";
  requested_registration_expiry: string;
  createdAt: string;
  vehicleId?: {
    number_plate?: string;
    model?: string;
  };
};

export default function RenewRegistrationPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [requests, setRequests] = useState<RenewalRequest[]>([]);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [initiatingRequestId, setInitiatingRequestId] = useState("");
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
          fetch("/api/services/renew-registration", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const vehicleData = await vehicleRes.json();
        const requestData = await requestRes.json();

        if (vehicleData.success) {
          setVehicles(vehicleData.data || []);
          const firstEligible = (vehicleData.data || []).find((v: VehicleOption) => v.eligible_for_renewal);
          if (firstEligible) {
            setSelectedPlate(firstEligible.number_plate);
          }
        }

        if (requestData.success) {
          setRequests(requestData.data || []);
        }
      } catch (error) {
        setMessage("Failed to load renewal data");
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

      const response = await fetch(`/api/services/renew-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ number_plate: selectedPlate }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Renewal request submitted successfully and is pending admin approval.");
        const requestRes = await fetch("/api/services/renew-registration", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const requestData = await requestRes.json();
        if (requestData.success) {
          setRequests(requestData.data || []);
        }
      } else {
        setMessage(data.error || "Failed to renew registration");
      }
    } catch (err) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = vehicles.find((item) => item.number_plate === selectedPlate);

  const handlePayNow = async (requestId: string) => {
    const token = getValidAuthTokenClient();
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    setInitiatingRequestId(requestId);
    setMessage("");

    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ request_id: requestId }),
      });

      const data = await response.json();
      if (!data.success) {
        setMessage(data.error || "Failed to initiate payment");
        return;
      }

      const paymentUrl = data?.data?.payment_url;
      if (!paymentUrl) {
        setMessage("Payment initiated, but no gateway URL was returned.");
        return;
      }

      router.push(paymentUrl);
    } catch (_error) {
      setMessage("Payment initiation failed. Please try again.");
    } finally {
      setInitiatingRequestId("");
    }
  };

  return (
    <div className={styles.container}>
      <Header userName={userName} />
      
      <main className={styles.main}>
        <div className={styles.formCard}>
          <h1>Renew Vehicle Registration</h1>
          <p className={styles.subtitle}>Submit a renewal request when less than 90 days remain before expiry</p>

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
                >
                  <option value="">Choose a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option
                      key={vehicle._id}
                      value={vehicle.number_plate}
                      disabled={!vehicle.eligible_for_renewal}
                    >
                      {vehicle.number_plate} ({vehicle.model}) - {vehicle.eligible_for_renewal ? "Eligible" : "Not eligible"}
                    </option>
                  ))}
                </select>
              </div>

              {selectedVehicle && (
                <div className={styles.statusCard}>
                  <h2>Eligibility</h2>
                  <div className={styles.statusGrid}>
                    <div className={styles.statusItem}>
                      <span className={styles.statusLabel}>Number Plate</span>
                      <span className={styles.statusValue}>{selectedVehicle.number_plate}</span>
                    </div>
                    <div className={styles.statusItem}>
                      <span className={styles.statusLabel}>Current Expiry</span>
                      <span className={styles.statusValue}>{new Date(selectedVehicle.registration_expiry).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.statusItem}>
                      <span className={styles.statusLabel}>Days Remaining</span>
                      <span className={styles.statusValue}>{selectedVehicle.days_remaining}</span>
                    </div>
                    <div className={styles.statusItem}>
                      <span className={styles.statusLabel}>Rule</span>
                      <span className={styles.statusValue}>{selectedVehicle.renewal_message}</span>
                    </div>
                  </div>
                </div>
              )}

              {message && (
                <div className={message.includes("success") ? styles.successMessage : styles.errorMessage}>
                  {message}
                </div>
              )}

              <div className={styles.buttonGroup}>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading || !selectedVehicle || !selectedVehicle.eligible_for_renewal}
                >
                  {loading ? "Submitting..." : "Submit Renewal Request"}
                </button>
                <button type="button" className={styles.cancelButton} onClick={() => router.push("/explore")}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className={styles.statusCard}>
            <h2>Your Renewal Requests</h2>
            {requests.length === 0 ? (
              <p className={styles.subtitle}>No renewal requests submitted yet.</p>
            ) : (
              <div className={styles.listWrapper}>
                {requests.map((request) => (
                  <div key={request._id} className={styles.listItem}>
                    <strong>{request.vehicleId?.number_plate || "Vehicle"}</strong>
                    <span>Status: {request.status}</span>
                    <span>Payment: {request.payment_status}</span>
                    <span>Requested expiry: {new Date(request.requested_registration_expiry).toLocaleDateString()}</span>
                    {request.status === "approved" && request.payment_status !== "success" && (
                      <button
                        type="button"
                        className={styles.submitButton}
                        onClick={() => handlePayNow(request._id)}
                        disabled={initiatingRequestId === request._id}
                      >
                        {initiatingRequestId === request._id ? "Redirecting..." : "Pay Now"}
                      </button>
                    )}
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
