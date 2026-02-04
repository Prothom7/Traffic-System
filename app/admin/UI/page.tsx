'use client';

import React from "react";
import { useRouter } from "next/navigation";
import styles from "./UI.module.css"; // Make a CSS module for styling buttons

export default function AdminUIPage() {
  const router = useRouter();

  return (
    <div className={styles.fullpage}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin UI Panel</h1>
      </header>

      <main className={styles.container}>
        <div className={styles.buttonGrid}>
          <button
            className={styles.uiButton}
            onClick={() => router.push("/admin/UI/newsletter")}
          >
            Newsletter
          </button>

          <button
            className={styles.uiButton}
            onClick={() => router.push("/admin/UI/carousel")}
          >
            Carousel
          </button>

          <button
            className={styles.uiButton}
            onClick={() => router.push("/admin/UI/employee")}
          >
            Employee
          </button>
        </div>
      </main>
    </div>
  );
}
