"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../adminHeader";
import styles from "./serviceRequests.module.css";
import { getValidAuthTokenClient } from "@/helpers/jwtClient";

type RenewalRequest = {
  _id: string;
  status: "pending" | "approved" | "rejected";
  payment_status: "not_required" | "pending" | "success" | "failed";
  userId?: { owner_name?: string; email?: string };
  vehicleId?: { number_plate?: string; model?: string };
};

type OwnershipRequest = {
  _id: string;
  status: "pending" | "approved" | "rejected";
  new_owner_email: string;
  userId?: { owner_name?: string; email?: string };
  vehicleId?: { number_plate?: string; model?: string };
};

type Payment = {
  _id: string;
  request_type: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: { owner_name?: string; email?: string };
  vehicle?: { number_plate?: string; model?: string };
};

export default function AdminServiceRequestsPage() {
  const router = useRouter();
  const [renewals, setRenewals] = useState<RenewalRequest[]>([]);
  const [ownership, setOwnership] = useState<OwnershipRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("");

  const loadData = async (token: string) => {
    const [renewalRes, ownershipRes, paymentRes] = await Promise.all([
      fetch("/api/admin/services/renewals", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/api/admin/services/ownership-requests", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/api/payments/history?all=true", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const renewalData = await renewalRes.json();
    const ownershipData = await ownershipRes.json();
    const paymentData = await paymentRes.json();

    if (renewalData.success) setRenewals(renewalData.data || []);
    if (ownershipData.success) setOwnership(ownershipData.data || []);
    if (paymentData.success) setPayments(paymentData.data || []);
  };

  useEffect(() => {
    const token = getValidAuthTokenClient();
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    const bootstrap = async () => {
      try {
        await loadData(token);
      } catch (_error) {
        setMessage("Failed to load admin service data");
      }
    };

    void bootstrap();
  }, [router]);

  const updateRenewal = async (requestId: string, status: "approved" | "rejected") => {
    const token = getValidAuthTokenClient();
    if (!token) return;

    const res = await fetch("/api/admin/services/renewals", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ request_id: requestId, status }),
    });

    const data = await res.json();
    if (!data.success) {
      setMessage(data.error || "Failed to update renewal");
      return;
    }

    await loadData(token);
  };

  const updateOwnership = async (requestId: string, status: "approved" | "rejected") => {
    const token = getValidAuthTokenClient();
    if (!token) return;

    const res = await fetch("/api/admin/services/ownership-requests", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ request_id: requestId, status }),
    });

    const data = await res.json();
    if (!data.success) {
      setMessage(data.error || "Failed to update ownership request");
      return;
    }

    await loadData(token);
  };

  return (
    <div className={styles.fullpage}>
      <AdminHeader />
      <main className={styles.container}>
        <h1 className={styles.title}>Service Requests And Payments</h1>
        {message && <div className={styles.message}>{message}</div>}

        <section className={styles.grid}>
          <div className={styles.panel}>
            <h2>Renewal Requests</h2>
            <div className={styles.list}>
              {renewals.map((item) => (
                <div key={item._id} className={styles.item}>
                  <strong>{item.vehicleId?.number_plate || "Vehicle"}</strong>
                  <span>Owner: {item.userId?.owner_name || "N/A"}</span>
                  <span>Status: {item.status}</span>
                  <span>Payment: {item.payment_status}</span>
                  {item.status === "pending" && (
                    <div className={styles.actions}>
                      <button className={`${styles.button} ${styles.approve}`} onClick={() => updateRenewal(item._id, "approved")}>Approve</button>
                      <button className={`${styles.button} ${styles.reject}`} onClick={() => updateRenewal(item._id, "rejected")}>Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <h2>Ownership Requests</h2>
            <div className={styles.list}>
              {ownership.map((item) => (
                <div key={item._id} className={styles.item}>
                  <strong>{item.vehicleId?.number_plate || "Vehicle"}</strong>
                  <span>Owner: {item.userId?.owner_name || "N/A"}</span>
                  <span>New Owner Email: {item.new_owner_email}</span>
                  <span>Status: {item.status}</span>
                  {item.status === "pending" && (
                    <div className={styles.actions}>
                      <button className={`${styles.button} ${styles.approve}`} onClick={() => updateOwnership(item._id, "approved")}>Approve</button>
                      <button className={`${styles.button} ${styles.reject}`} onClick={() => updateOwnership(item._id, "rejected")}>Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <h2>All Payments</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Owner</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{payment.vehicle?.number_plate || "N/A"}</td>
                    <td>{payment.user?.owner_name || "N/A"}</td>
                    <td>{payment.request_type}</td>
                    <td>{payment.amount}</td>
                    <td>{payment.status}</td>
                    <td>{new Date(payment.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
