"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { decodeJWTClient } from "@/helpers/jwtClient";
import styles from "./payment.module.css";

const paymentMethods = ["Card", "Mobile Banking", "Bank Transfer", "Wallet"];

export default function TicketPaymentPage() {
  const router = useRouter();
  const params = useParams<{ ticketId: string }>();
  const searchParams = useSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState(paymentMethods[0]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const ticketId = params?.ticketId || "";

  const userName = useMemo(() => {
    if (typeof window === "undefined") return "User";
    const token = localStorage.getItem("authToken");
    if (!token) return "User";
    return decodeJWTClient(token)?.name || "User";
  }, []);

  const ticketType = searchParams.get("type") || "Violation";
  const ticketStatus = searchParams.get("status") || "Pending";
  const ticketDate = searchParams.get("date") || "-";
  const ticketLocation = searchParams.get("location") || "Not recorded";
  const fineAmount = searchParams.get("amount") || "0";

  const formatDate = (value: string) => {
    if (!value || value === "-") return "-";
    return new Date(value).toLocaleDateString();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    if (!ticketId) {
      setIsError(true);
      setMessage("Ticket id is missing.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/payments/gateway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recordId: ticketId,
          paymentMethod: method,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setIsError(true);
        setMessage(data?.error || "Payment failed.");
        return;
      }

      const reference = data?.data?.gatewayReference ? ` Reference: ${data.data.gatewayReference}` : "";
      setIsError(false);
      setMessage(`Payment successful.${reference}`);
    } catch (error) {
      setIsError(true);
      setMessage("Unable to complete payment right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Header userName={userName} />

      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <div className={styles.headerBadge}>Tickets & Violations</div>
          <h1>Ticket Payment</h1>
          <p>Select a payment method and complete your ticket payment</p>
        </section>

        <section className={styles.paymentGrid}>
          <article className={styles.summaryCard}>
            <h2>Ticket Summary</h2>
            <div className={styles.summaryRow}>
              <span>Ticket ID</span>
              <strong>{ticketId}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Violation</span>
              <strong>{ticketType}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Status</span>
              <strong>{ticketStatus}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Date</span>
              <strong>{formatDate(ticketDate)}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Location</span>
              <strong>{ticketLocation}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Fine Amount</span>
              <strong className={styles.amount}>{fineAmount}</strong>
            </div>
          </article>

          <article className={styles.paymentCard}>
            <h2>Pay Ticket</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <label htmlFor="paymentMethod">Payment Method</label>
              <select
                id="paymentMethod"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={styles.select}
              >
                {paymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod} value={paymentMethod}>
                    {paymentMethod}
                  </option>
                ))}
              </select>

              <button type="submit" className={styles.payButton} disabled={submitting}>
                {submitting ? "Processing..." : "Confirm Payment"}
              </button>

              <button
                type="button"
                className={styles.backButton}
                onClick={() => router.push("/tickets&violations")}
              >
                Back to Tickets
              </button>
            </form>

            {message && (
              <div className={`${styles.message} ${isError ? styles.error : styles.success}`}>
                {message}
              </div>
            )}
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
