"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "./check-email.module.css";

export default function CheckEmailPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <section className={styles.card}>
          <div className={styles.badge}>Verification Required</div>
          <h1>Check your email</h1>
          <p>
            We sent a verification link to your email address. Please open the
            message and click the verification button to activate your account.
          </p>
          <div className={styles.steps}>
            <div>
              <span>1</span>
              <p>Open your inbox</p>
            </div>
            <div>
              <span>2</span>
              <p>Find the "Verify your vehicle registration" email</p>
            </div>
            <div>
              <span>3</span>
              <p>Click the verification button</p>
            </div>
          </div>
          <div className={styles.actions}>
            <button onClick={() => router.push("/authentication/signin")}>
              Go to Sign In
            </button>
            <button className={styles.secondary} onClick={() => router.push("/authentication/signup")}
            >
              Back to Registration
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
