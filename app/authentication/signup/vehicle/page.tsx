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
        owner_name: "",
        owner_email: "",
        owner_contact: "",
        vehicle_type: "",
        model: "",
        isAdmin: false,
    });

    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const allFilled =
            vehicle.number_plate &&
            vehicle.owner_name &&
            vehicle.owner_email &&
            vehicle.owner_contact &&
            vehicle.vehicle_type &&
            vehicle.model;

        setButtonDisabled(!allFilled);
    }, [vehicle]);

    const onSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            await axios.post("/api/authentication/signup", vehicle);

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
                        onChange={(e) =>
                            setVehicle({ ...vehicle, number_plate: e.target.value })
                        }
                        className={styles.input}
                        required
                    />

                    <input
                        type="text"
                        placeholder="Owner Name"
                        value={vehicle.owner_name}
                        onChange={(e) =>
                            setVehicle({ ...vehicle, owner_name: e.target.value })
                        }
                        className={styles.input}
                        required
                    />

                    <input
                        type="email"
                        placeholder="Owner Email"
                        value={vehicle.owner_email}
                        onChange={(e) =>
                            setVehicle({ ...vehicle, owner_email: e.target.value })
                        }
                        className={styles.input}
                        required
                    />

                    <input
                        type="text"
                        placeholder="Owner Contact"
                        value={vehicle.owner_contact}
                        onChange={(e) =>
                            setVehicle({ ...vehicle, owner_contact: e.target.value })
                        }
                        className={styles.input}
                        required
                    />

                    <select
                        className={styles.input}
                        value={vehicle.vehicle_type}
                        onChange={(e) =>
                            setVehicle({ ...vehicle, vehicle_type: e.target.value })
                        }
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
                        onChange={(e) =>
                            setVehicle({ ...vehicle, model: e.target.value })
                        }
                        className={styles.input}
                        required
                    />

                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={vehicle.isAdmin}
                            onChange={(e) =>
                                setVehicle({ ...vehicle, isAdmin: e.target.checked })
                            }
                        />
                        Register as Admin
                    </label>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={buttonDisabled || loading}
                    >
                        {buttonDisabled
                            ? "Fill all fields"
                            : loading
                            ? "Registering..."
                            : "Register Vehicle"}
                    </button>

                    <Link href="/authentication/signin" className={styles.link}>
                        Already registered? Sign in
                    </Link>
                </form>
            </div>
        </div>
    );
}
