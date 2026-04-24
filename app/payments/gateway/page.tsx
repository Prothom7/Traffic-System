"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "./gateway.module.css";
import { decodeJWTClient, getValidAuthTokenClient } from "@/helpers/jwtClient";

type GatewaySession = {
  payment_id: string;
  amount: number;
  transaction_id: string;
  provider_status: "initiated" | "success" | "failed";
  status: "pending" | "success" | "failed";
  vehicle?: {
    number_plate?: string;
    model?: string;
  };
};

export default function PaymentGatewayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userName, setUserName] = useState("User");
  const [sessionToken, setSessionToken] = useState("");
  const [sessionData, setSessionData] = useState<GatewaySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

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

    const incomingSession = searchParams.get("session") || "";
    if (!incomingSession) {
      setMessage("Missing payment session token.");
      setLoading(false);
      return;
    }

    setSessionToken(incomingSession);

    const fetchSession = async () => {
      try {
        const response = await fetch(
          `/api/payments/provider/session?session_token=${encodeURIComponent(incomingSession)}`
        );
        const data = await response.json();

        if (!data.success) {
          setMessage(data.error || "Unable to load payment session");
          return;
        }

        setSessionData(data.data);
      } catch (_error) {
        setMessage("Unable to load payment session");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router, searchParams]);

  const completeAndVerify = async (result: "success" | "failed") => {
    if (!sessionToken || !sessionData) {
      setMessage("Payment session is not ready");
      return;
    }

    const token = getValidAuthTokenClient();
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    setProcessing(true);
    setMessage("");

    try {
      const completeResponse = await fetch("/api/payments/provider/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_token: sessionToken,
          result,
        }),
      });

      const completeData = await completeResponse.json();
      if (!completeData.success) {
        setMessage(completeData.error || "Gateway rejected the payment action");
        return;
      }

      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_id: sessionData.payment_id,
          transaction_id: sessionData.transaction_id,
          payment_method: "mock_gateway",
        }),
      });

      const verifyData = await verifyResponse.json();
      if (verifyData.success) {
        router.push("/services/payment-history?payment=success");
        return;
      }

      if (verifyResponse.status === 202) {
        setMessage("Payment is still pending. Please verify again shortly.");
        return;
      }

      router.push("/services/payment-history?payment=failed");
    } catch (_error) {
      setMessage("Payment processing failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <Header userName={userName} />

      <main className={styles.main}>
        <section className={styles.card}>
          <h1>Secure Payment Gateway</h1>
          <p>Review the transaction and choose an outcome to complete verification.</p>

          {loading ? (
            <div className={styles.info}>Loading payment session...</div>
          ) : !sessionData ? (
            <div className={styles.error}>{message || "Invalid payment session"}</div>
          ) : (
            <>
              <div className={styles.summaryGrid}>
                <div>
                  <span>Transaction ID</span>
                  <strong>{sessionData.transaction_id}</strong>
                </div>
                <div>
                  <span>Vehicle</span>
                  <strong>{sessionData.vehicle?.number_plate || "N/A"}</strong>
                </div>
                <div>
                  <span>Model</span>
                  <strong>{sessionData.vehicle?.model || "N/A"}</strong>
                </div>
                <div>
                  <span>Amount</span>
                  <strong>{sessionData.amount}</strong>
                </div>
              </div>

              {message && <div className={styles.error}>{message}</div>}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.successButton}
                  onClick={() => completeAndVerify("success")}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Simulate Success"}
                </button>
                <button
                  type="button"
                  className={styles.failButton}
                  onClick={() => completeAndVerify("failed")}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Simulate Failure"}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => router.push("/services/payment-history")}
                  disabled={processing}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
