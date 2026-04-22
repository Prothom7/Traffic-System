"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import styles from "../services.module.css";
import { decodeJWTClient } from "@/helpers/jwtClient";

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [userName] = useState(() => {
    if (typeof window === "undefined") return "User";
    const token = localStorage.getItem("authToken");
    if (!token) return "User";
    const decoded = decodeJWTClient(token);
    return decoded?.name || "User";
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

  }, [router]);

  return (
    <div className={styles.container}>
      <Header userName={userName} />
      
      <main className={styles.main}>
        <div className={styles.formCard}>
          <h1>Payment History</h1>
          <p className={styles.subtitle}>View all your transaction and payment records</p>

          <div className={styles.comingSoon}>
            <div className={styles.comingSoonIcon}>💳</div>
            <h2>Coming Soon</h2>
            <p>Payment history feature will be available soon. You&apos;ll be able to view all your transactions, fines, and payment records here.</p>
            <button className={styles.submitButton} onClick={() => router.push("/explore")}>
              Back to Services
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
