'use client';

import React from "react";
import { useRouter } from "next/navigation";
import styles from "./UI.module.css";
import AdminHeader from "../adminHeader";

export default function AdminUIPage() {
  const router = useRouter();

  return (
    <div className={styles.fullpage}>
      <AdminHeader />

      <main className={styles.container}>
        <div className={styles.buttonGrid}>
          <button
            className={styles.uiButton}
            onClick={() => router.push("/admin/UI/newsfeed")}
          >
            Newsfeed
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
