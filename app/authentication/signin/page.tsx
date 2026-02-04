'use client';

import React, { useEffect, useState } from "react";
import styles from './signin.module.css';
import Link from "next/link";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState({ email: "", password: "" });
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className={styles.fullpage}>
      <div className={styles.container}>
        <h2 className={styles.title}>{loading ? "Signing in..." : "Sign in"}</h2>
        <form onSubmit={onLogin} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            className={styles.input}
            required
          />
          <button
            type="submit"
            className={styles.button}
            disabled={buttonDisabled || loading}
          >
            {buttonDisabled ? "Fill all fields" : loading ? "Logging in..." : "Log In"}
          </button>

          <Link href="/authentication/signup/vehicle" className={styles.link}>
            Register Vehicle
          </Link>
          <Link href="/authentication/signup/driver" className={styles.link}>
            Register Driver
          </Link>
        </form>
      </div>
    </div>
  );
}
