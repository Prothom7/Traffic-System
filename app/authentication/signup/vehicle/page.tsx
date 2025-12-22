'use client';

import React, { useEffect, useState } from "react";
import styles from './vehicle.module.css';
import Link from "next/link";

export default function VehicleSignupPage() {
    const [vehicle, setVehicle] = useState({
        number_plate: "",
        owner_name: "",
        owner_contact: "",
        owner_address: "",
        vehicle_type: "",
        model: "",
        year_of_manufacture: "",
        color: "",
        engine_type: "",
        chassis_number: "",
        registration_date: "",
        registration_expiry: "",
        credit_score: "",
        status: ""
    });

    const [buttonDisabled, setButtonDisabled] = useState(true);

    useEffect(() => {
        const allFilled = Object.values(vehicle).every(
            (value) => value !== ""
        );
        setButtonDisabled(!allFilled);
    }, [vehicle]);

    const onSignup = (e: React.FormEvent) => {
        e.preventDefault();
        console.log(vehicle);
        alert("Vehicle registered successfully!");
    };

    return (
        <div className={styles.fullpage}>
            <div className={styles.container}>
                <h2 className={styles.title}>Vehicle Registration</h2>

                <form onSubmit={onSignup} className={styles.form}>
                    
                    <input
                        type="text"
                        placeholder="Number Plate"
                        value={vehicle.number_plate}
                        onChange={(e) => setVehicle({ ...vehicle, number_plate: e.target.value })}
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
                        type="text"
                        placeholder="Owner Contact"
                        value={vehicle.owner_contact}
                        onChange={(e) => setVehicle({ ...vehicle, owner_contact: e.target.value })}
                        className={styles.input}
                        required
                    />

                    <textarea
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
                        type="number"
                        placeholder="Year of Manufacture"
                        value={vehicle.year_of_manufacture}
                        onChange={(e) => setVehicle({ ...vehicle, year_of_manufacture: e.target.value })}
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
                    </select>

                    <input
                        type="text"
                        placeholder="Chassis Number"
                        value={vehicle.chassis_number}
                        onChange={(e) => setVehicle({ ...vehicle, chassis_number: e.target.value })}
                        className={styles.input}
                        required
                    />

                    <input
                        type="datetime-local"
                        value={vehicle.registration_date}
                        onChange={(e) => setVehicle({ ...vehicle, registration_date: e.target.value })}
                        className={styles.input}
                        required
                    />

                    <input
                        type="datetime-local"
                        value={vehicle.registration_expiry}
                        onChange={(e) => setVehicle({ ...vehicle, registration_expiry: e.target.value })}
                        className={styles.input}
                        required
                    />

                    <input
                        type="number"
                        placeholder="Credit Score"
                        value={vehicle.credit_score}
                        onChange={(e) => setVehicle({ ...vehicle, credit_score: e.target.value })}
                        className={styles.input}
                        required
                    />

                    <select
                        className={styles.input}
                        value={vehicle.status}
                        onChange={(e) => setVehicle({ ...vehicle, status: e.target.value })}
                        required
                    >
                        <option value="">Select Status</option>
                        <option value="Active">Active</option>
                        <option value="Stolen">Stolen</option>
                        <option value="Suspended">Suspended</option>
                    </select>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={buttonDisabled}
                    >
                        {buttonDisabled ? "Fill all fields" : "Register Vehicle"}
                    </button>

                    <Link href="/authentication/signin" className={styles.link}>
                        Already registered? Sign in
                    </Link>
                </form>
            </div>
        </div>
    );
}
