'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import styles from "./vehicle.module.css";
import Link from "next/link";

export default function VehicleSignupPage() {
  const router = useRouter();

  const [vehicle, setVehicle] = useState({
    number_plate: "",
    chassis_number: "",
    owner_name: "",
    owner_email: "",
    owner_contact: "",
    owner_address: "",
    vehicle_type: "",
    model: "",
    password: "",
    color: "",
    year_of_manufacture: "",
    engine_type: "",
    registration_expiry: "",
  });

  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const allFilled = Object.values(vehicle).every((v) => v !== "");
    setButtonDisabled(!allFilled);
  }, [vehicle]);

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        ...vehicle,
        year_of_manufacture: Number(vehicle.year_of_manufacture),
        registration_expiry: new Date(vehicle.registration_expiry),
      };

      await axios.post("/api/authentication/signup", payload);

      toast.success("Verification email sent!");
      router.push("/check-email");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.fullpage}>
      <div className={styles.container}>
        <h2 className={styles.title}>
          {loading ? "Processing..." : "Vehicle Registration"}
        </h2>

        <form onSubmit={onSignup} className={styles.form}>
          <input
            type="text"
            placeholder="Number Plate"
            value={vehicle.number_plate}
            onChange={(e) => setVehicle({ ...vehicle, number_plate: e.target.value.toUpperCase() })}
            className={styles.input}
            required
          />

          <input
            type="text"
            placeholder="Chassis Number"
            value={vehicle.chassis_number}
            onChange={(e) => setVehicle({ ...vehicle, chassis_number: e.target.value })}
            className={styles.input}
            required
          />

          <input
            type="text"
            placeholder="Owner Name"
            value={vehicle.owner_name}
            onChange={(e) => setVehicle({ ...vehicle, owner_name: e.target.value })}
            className={styles.input}
            required
          />

          <input
            type="email"
            placeholder="Owner Email"
            value={vehicle.owner_email}
            onChange={(e) => setVehicle({ ...vehicle, owner_email: e.target.value })}
            className={styles.input}
            required
          />

          <input
            type="text"
            placeholder="Owner Contact"
            value={vehicle.owner_contact}
            onChange={(e) => setVehicle({ ...vehicle, owner_contact: e.target.value })}
            className={styles.input}
            required
          />

          <input
            type="text"
            placeholder="Owner Address"
            value={vehicle.owner_address}
            onChange={(e) => setVehicle({ ...vehicle, owner_address: e.target.value })}
            className={styles.input}
            required
          />

          <select
            className={styles.input}
            value={vehicle.vehicle_type}
            onChange={(e) => setVehicle({ ...vehicle, vehicle_type: e.target.value })}
            required
          >
            <option value="">Select Vehicle Type</option>
            <option value="Car">Car</option>
            <option value="Truck">Truck</option>
            <option value="Motorcycle">Motorcycle</option>
            <option value="Bus">Bus</option>
            <option value="Van">Van</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="text"
            placeholder="Vehicle Model"
            value={vehicle.model}
            onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
            className={styles.input}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={vehicle.password}
            onChange={(e) => setVehicle({ ...vehicle, password: e.target.value })}
            className={styles.input}
            required
          />

          <input
            type="text"
            placeholder="Color"
            value={vehicle.color}
            onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
            className={styles.input}
            required
          />

          <input
            type="number"
            placeholder="Year of Manufacture"
            value={vehicle.year_of_manufacture}
            onChange={(e) => setVehicle({ ...vehicle, year_of_manufacture: e.target.value })}
            className={styles.input}
            min={1900}
            max={new Date().getFullYear()}
            required
          />

          <select
            className={styles.input}
            value={vehicle.engine_type}
            onChange={(e) => setVehicle({ ...vehicle, engine_type: e.target.value })}
            required
          >
            <option value="">Select Engine Type</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
            <option value="CNG">CNG</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="date"
            placeholder="Registration Expiry"
            value={vehicle.registration_expiry}
            onChange={(e) => setVehicle({ ...vehicle, registration_expiry: e.target.value })}
            className={styles.input}
            required
          />

          <button
            type="submit"
            className={styles.button}
            disabled={buttonDisabled || loading}
          >
            {buttonDisabled ? "Fill all fields" : loading ? "Registering..." : "Register Vehicle"}
          </button>

          <Link href="/authentication/signin" className={styles.link}>
            Already registered? Sign in
          </Link>
        </form>
      </div>
    </div>
  );
}
