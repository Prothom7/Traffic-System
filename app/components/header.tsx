"use client";

import React from "react";
import styles from "./header.module.css";
import { useRouter, usePathname } from "next/navigation";

interface HeaderProps {
  userName: string;
}

export default function Header({ userName }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const logout = () => {
    localStorage.clear();
    router.push("/authentication/signin");
  };

  const isActive = (path: string) => {
    return pathname === path ? styles.active : "";
  };

  return (
    <>
      {/* TOP BAR */}
      <header className={styles.header}>
        <div className={styles.topbar}>
          <div className={styles.logo}>Traffic Management System</div>
          <div className={styles.headerRight}>
            <span className={styles.userName}>Welcome, {userName}</span>
            <button onClick={logout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        {/* NAVBAR */}
        <nav className={styles.navBar}>
          <ul>
          <li
            className={isActive("/explore")}
            onClick={() => router.push("/explore")}
          >
            Explore
          </li>

          <li
            className={isActive("/dashboard")}
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </li>

          <li
            className={isActive("/myvehicle")}
            onClick={() => router.push("/myvehicle")}
          >
            My Vehicles
          </li>

          <li
            className={isActive("/tickets&violations")}
            onClick={() => router.push("/tickets&violations")}
          >
            Tickets & Violations
          </li>

          <li
            className={isActive("/reports")}
            onClick={() => router.push("/reports")}
          >
            Reports
          </li>

          <li
            className={isActive("/profile")}
            onClick={() => router.push("/profile")}
          >
            Profile
          </li>
        </ul>
      </nav>
      </header>
    </>
  );
}
