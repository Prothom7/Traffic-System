'use client';

import React, { useEffect, useState } from "react";
import styles from './signin.module.css';
import Link from "next/link";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const infoIconSrc = "/source/info.png";
  const [user, setUser] = useState({ email: "", password: "" });
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  useEffect(() => {
    setButtonDisabled(!(user.email && user.password));
  }, [user]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("/api/authentication/signin", user);

      if (res.data.success && res.data.token) {
        toast.success("Logged in successfully!");
        localStorage.setItem("authToken", res.data.token);
        router.push("/explore");
      }
    } catch (error: any) {
      if (error.response?.data?.error === "Email not verified") {
        toast.error("Please verify your email first.");
        router.push("/check-email");
      } else {
        toast.error(error.response?.data?.error || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const tooltips = {
    email: { label: "Email", example: "e.g., nabil2107073@gmail.com", help: "Enter the email address you registered with" },
    password: { label: "Password", example: "e.g., SecurePass@123", help: "Your account password - case sensitive" },
  };

  return (
    <div className={styles.fullpage}>
      {/* Top header */}
      <header className={styles.header}>Traffic System</header>

      {/* Main content */}
      <div className={styles.main}>
        <div className={styles.welcome}>
          Welcome to Traffic System
        </div>

        <div className={styles.container}>
          <h2 className={styles.title}>{loading ? "Signing in..." : "Sign in"}</h2>
          <form onSubmit={onLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  placeholder="Enter Your Email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className={styles.input}
                  required
                />
                <span 
                  className={styles.infoIcon}
                  onMouseEnter={() => setShowTooltip("email")}
                  onMouseLeave={() => setShowTooltip(null)}
                  title="Enter your registered email"
                >
                  <img src={infoIconSrc} alt="Field info" className={styles.infoIconImage} />
                </span>
              </div>
              {showTooltip === "email" && (
                <div className={styles.tooltip}>
                  <p className={styles.tooltipText}>{tooltips.email.help}</p>
                  <p className={styles.tooltipExample}>{tooltips.email.example}</p>
                </div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={user.password}
                  onChange={(e) => setUser({ ...user, password: e.target.value })}
                  className={styles.input}
                  required
                />
                <span 
                  className={styles.infoIcon}
                  onMouseEnter={() => setShowTooltip("password")}
                  onMouseLeave={() => setShowTooltip(null)}
                  title="Enter your password"
                >
                  <img src={infoIconSrc} alt="Field info" className={styles.infoIconImage} />
                </span>
              </div>
              {showTooltip === "password" && (
                <div className={styles.tooltip}>
                  <p className={styles.tooltipText}>{tooltips.password.help}</p>
                  <p className={styles.tooltipExample}>{tooltips.password.example}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={buttonDisabled || loading}
            >
              {buttonDisabled ? "Fill all fields" : loading ? "Logging in..." : "Log In"}
            </button>

            <Link href="/authentication/signup/vehicle" className={styles.link}>
              Register 
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
