'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import styles from "./vehicle.module.css";
import Link from "next/link";

export default function UserSignupPage() {
  const router = useRouter();

  const [user, setUser] = useState({
    owner_name: "",
    email: "",
    password: "",
    contact: "",
    address: "",
  });

  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  useEffect(() => {
    const allFilled = Object.values(user).every((v) => v !== "");
    setButtonDisabled(!allFilled);
  }, [user]);

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      await axios.post("/api/authentication/signup", user);

      toast.success("Verification email sent!");
      router.push("/check-email");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const tooltips = {
    owner_name: { label: "Full Name", example: "e.g., John Ahmed Khan", help: "Enter your complete first and last name" },
    email: { label: "Email", example: "e.g., john.khan@gmail.com", help: "Use a valid email you can access" },
    password: { label: "Password", example: "e.g., SecurePass@123", help: "Min 8 chars: letters, numbers, special chars" },
    contact: { label: "Contact Number", example: "e.g., +923001234567 or 0300-1234567", help: "Your phone number for communication" },
    address: { label: "Address", example: "e.g., 123 Main Street, Karachi, Pakistan", help: "Your residential or business address" },
  };

  return (
    <div className={styles.fullpage}>
      {/* Header at top-left */}
      <div className={styles.header}>
        User Registration Portal
      </div>

      {/* Main container */}
      <div className={styles.container}>
        <h2 className={styles.title}>
          {loading ? "Processing..." : "Create Account"}
        </h2>

        <form onSubmit={onSignup} className={styles.form}>
          <div className={styles.inputGroup}>
            <div className={styles.labelWithIcon}>
              <label>Full Name</label>
              <span 
                className={styles.infoIcon}
                onMouseEnter={() => setShowTooltip("owner_name")}
                onMouseLeave={() => setShowTooltip(null)}
                title="Enter your complete name"
              >
                ℹ️
              </span>
              {showTooltip === "owner_name" && (
                <div className={styles.tooltip}>
                  <p className={styles.tooltipText}>{tooltips.owner_name.help}</p>
                  <p className={styles.tooltipExample}>{tooltips.owner_name.example}</p>
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="John Ahmed Khan"
              value={user.owner_name}
              onChange={(e) => setUser({ ...user, owner_name: e.target.value })}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.labelWithIcon}>
              <label>Email</label>
              <span 
                className={styles.infoIcon}
                onMouseEnter={() => setShowTooltip("email")}
                onMouseLeave={() => setShowTooltip(null)}
                title="Enter a valid email address"
              >
                ℹ️
              </span>
              {showTooltip === "email" && (
                <div className={styles.tooltip}>
                  <p className={styles.tooltipText}>{tooltips.email.help}</p>
                  <p className={styles.tooltipExample}>{tooltips.email.example}</p>
                </div>
              )}
            </div>
            <input
              type="email"
              placeholder="your.email@example.com"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.labelWithIcon}>
              <label>Password</label>
              <span 
                className={styles.infoIcon}
                onMouseEnter={() => setShowTooltip("password")}
                onMouseLeave={() => setShowTooltip(null)}
                title="Create a strong password"
              >
                ℹ️
              </span>
              {showTooltip === "password" && (
                <div className={styles.tooltip}>
                  <p className={styles.tooltipText}>{tooltips.password.help}</p>
                  <p className={styles.tooltipExample}>{tooltips.password.example}</p>
                </div>
              )}
            </div>
            <input
              type="password"
              placeholder="SecurePass@123"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.labelWithIcon}>
              <label>Contact Number</label>
              <span 
                className={styles.infoIcon}
                onMouseEnter={() => setShowTooltip("contact")}
                onMouseLeave={() => setShowTooltip(null)}
                title="Enter your contact number"
              >
                ℹ️
              </span>
              {showTooltip === "contact" && (
                <div className={styles.tooltip}>
                  <p className={styles.tooltipText}>{tooltips.contact.help}</p>
                  <p className={styles.tooltipExample}>{tooltips.contact.example}</p>
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="+923001234567"
              value={user.contact}
              onChange={(e) => setUser({ ...user, contact: e.target.value })}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.labelWithIcon}>
              <label>Address</label>
              <span 
                className={styles.infoIcon}
                onMouseEnter={() => setShowTooltip("address")}
                onMouseLeave={() => setShowTooltip(null)}
                title="Enter your complete address"
              >
                ℹ️
              </span>
              {showTooltip === "address" && (
                <div className={styles.tooltip}>
                  <p className={styles.tooltipText}>{tooltips.address.help}</p>
                  <p className={styles.tooltipExample}>{tooltips.address.example}</p>
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="123 Main Street, Karachi, Pakistan"
              value={user.address}
              onChange={(e) => setUser({ ...user, address: e.target.value })}
              className={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={buttonDisabled || loading}
          >
            {buttonDisabled ? "Fill all fields" : loading ? "Creating account..." : "Register"}
          </button>

          <Link href="/authentication/signin" className={styles.link}>
            Already have an account? Sign in
          </Link>
        </form>
      </div>
    </div>
  );
}

