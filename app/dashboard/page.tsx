'use client';

import React, { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // ensure we are on client
    const token = localStorage.getItem("authToken");
    const name = localStorage.getItem("authName") || "User"; // fallback

    if (!token) {
      router.push("/authentication/signin");
    } else {
      setUserName(name);
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authName");
    router.push("/authentication/signin");
  };

  if (!mounted) return null;

  return (
    <div className={styles.dashboardPage}>
      <header className={styles.header}>
        <h1>Welcome, {userName}!</h1>
        <button className={styles.logoutButton} onClick={logout}>
          Logout
        </button>
      </header>
    </div>
  );
}
