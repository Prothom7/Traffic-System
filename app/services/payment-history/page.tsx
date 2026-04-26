"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "../services.module.css";
import { decodeJWTClient, getValidAuthTokenClient } from "@/helpers/jwtClient";

type PaymentItem = {
  _id: string;
  request_type: string;
  amount: number;
  status: "pending" | "success" | "failed";
  payment_method?: string;
  paid_at?: string;
  createdAt: string;
  vehicle?: {
    number_plate?: string;
    model?: string;
  };
  user?: {
    owner_name?: string;
    email?: string;
  };
  request?: {
    _id?: string;
    status?: string;
    payment_status?: string;
  };
};

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [userName, setUserName] = useState(() => {
    if (typeof window === "undefined") return "User";
    const token = localStorage.getItem("authToken");
    if (!token) return "User";
    const decoded = decodeJWTClient(token);
    return decoded?.name || "User";
  });
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [processingRequestId, setProcessingRequestId] = useState("");

  useEffect(() => {
    const token = getValidAuthTokenClient();
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    const decoded = decodeJWTClient(token);
    if (decoded?.name) {
      setUserName(decoded.name);
    }

    const fetchPayments = async () => {
      try {
        const response = await fetch("/api/payments/history?all=true", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setPayments(data.data || []);
        } else {
          setMessage(data.error || "Failed to load payment history");
        }
      } catch (error) {
        setMessage("Failed to load payment history");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();

    const paymentResult = new URLSearchParams(window.location.search).get("payment");
    if (paymentResult === "success") {
      setMessage("Payment completed and verified successfully.");
    }
    if (paymentResult === "failed") {
      setMessage("Payment failed at gateway. You can retry from this page.");
    }

  }, [router]);

  const handlePayNow = async (requestId: string) => {
    const token = getValidAuthTokenClient();
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    setProcessingRequestId(requestId);
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
      } else {
        const paymentUrl = data?.data?.payment_url;
        if (paymentUrl) {
          router.push(paymentUrl);
          return;
        }
        setMessage("Payment initiated, but no payment URL was returned.");
      }
    } catch (error) {
      setMessage("Payment initiation failed. Please try again.");
    } finally {
      setProcessingRequestId("");
    }
  };

  return (
    <div className={styles.container}>
      <Header userName={userName} />
      
      <main className={styles.main}>
        <div className={styles.formCard}>
          <h1>Payment History</h1>
          <p className={styles.subtitle}>View and manage request-linked payments</p>

          {message && <div className={styles.errorMessage}>{message}</div>}

          {loading ? (
            <p className={styles.subtitle}>Loading payments...</p>
          ) : payments.length === 0 ? (
            <p className={styles.subtitle}>No payments found.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Owner</th>
                    <th>Request Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const requestId = payment.request?._id || "";

                    return (
                      <tr key={payment._id}>
                        <td>{payment.vehicle?.number_plate || "N/A"}</td>
                        <td>{payment.user?.owner_name || "N/A"}</td>
                        <td>{payment.request_type}</td>
                        <td>{payment.amount}</td>
                        <td>{payment.status}</td>
                        <td>{new Date(payment.createdAt).toLocaleString()}</td>
                        <td>
                          {requestId &&
                          payment.request?.status === "approved" &&
                          payment.status !== "success" ? (
                            <button
                              className={styles.submitButton}
                              onClick={() => handlePayNow(requestId)}
                              disabled={processingRequestId === requestId}
                            >
                              {processingRequestId === requestId ? "Redirecting..." : "Pay Now"}
                            </button>
                          ) : (
                            <span className={styles.statusLabel}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button className={styles.cancelButton} onClick={() => router.push("/explore")}>
              Back to Services
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
