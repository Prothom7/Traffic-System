'use client';

import { useEffect, useState } from "react";
import styles from "./vehicles.module.css";
import AdminHeader from "../adminHeader";

type Vehicle = {
  _id: string;
  number_plate: string;
  owner_name: string;
  owner_email: string;
  owner_contact: string;
  vehicle_type: string;
  model: string;
  isVerified: boolean;
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const res = await fetch("/api/vehicles");
        if (!res.ok) throw new Error("Failed to fetch vehicles");
        const data: Vehicle[] = await res.json();
        setVehicles(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchVehicles();
  }, []);

  if (loading)
    return (
      <div className={styles.fullpage}>
        <AdminHeader />
        <main className={styles.container}>
          <p className={styles.loading}>Loading vehicles...</p>
        </main>
      </div>
    );

  if (error)
    return (
      <div className={styles.fullpage}>
        <AdminHeader />
        <main className={styles.container}>
          <p className={styles.error}>{error}</p>
        </main>
      </div>
    );

  return (
    <div className={styles.fullpage}>
      <AdminHeader />

      <main className={styles.container}>
        <h2 className={styles.sectionTitle}>Vehicle Registry</h2>

        {vehicles.length === 0 ? (
          <p className={styles.empty}>No vehicles found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Plate</th>
                <th>Owner</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Model</th>
                <th>Verified</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v._id}>
                  <td>{v.number_plate}</td>
                  <td>{v.owner_name}</td>
                  <td>{v.owner_contact}</td>
                  <td>{v.vehicle_type}</td>
                  <td>{v.model}</td>
                  <td>{v.isVerified ? "✅ Yes" : "❌ No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
