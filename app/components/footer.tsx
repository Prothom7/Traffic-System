import React from "react";
import styles from "@/app/dashboard/dashboard.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div>
          <h3>Traffic Management System</h3>
          <p>Smart traffic monitoring & digital enforcement</p>
        </div>

        <div className={styles.footerLinks}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Help</a>
          <a href="#">Contact</a>
        </div>
      </div>

      <div className={styles.footerBottom}>
        © {new Date().getFullYear()} Traffic Management System
      </div>
    </footer>
  );
}
