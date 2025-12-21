'use client';

import React, { useEffect, useState } from "react";
import styles from './driver.module.css';
import Link from "next/link";

export default function DriverVehicleAssignmentPage() {
    const [assignment, setAssignment] = useState({
        vehicle_id: "",
        driver_id: "",
        assigned_from: "",
        assigned_to: "",
        driver_credit_score: "100"
    });

    const [buttonDisabled, setButtonDisabled] = useState(true);

    useEffect(() => {
        const requiredFieldsFilled =
            assignment.vehicle_id &&
            assignment.driver_id &&
            assignment.assigned_from &&
            assignment.driver_credit_score;

        setButtonDisabled(!requiredFieldsFilled);
    }, [assignment]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log(assignment);
        alert("Driver assigned to vehicle successfully!");
    };

    return (
        <div className={styles.fullpage}>
            <div className={styles.container}>
                <h2 className={styles.title}>Register as Driver</h2>

                <form onSubmit={onSubmit} className={styles.form}>

                    <input
                        type="number"
                        placeholder="Vehicle ID"
                        value={assignment.vehicle_id}
                        onChange={(e) =>
                            setAssignment({ ...assignment, vehicle_id: e.target.value })
                        }
                        className={styles.input}
                        required
                    />

                    <input
                        type="number"
                        placeholder="Driver ID"
                        value={assignment.driver_id}
                        onChange={(e) =>
                            setAssignment({ ...assignment, driver_id: e.target.value })
                        }
                        className={styles.input}
                        required
                    />

                    <input
                        type="datetime-local"
                        value={assignment.assigned_from}
                        onChange={(e) =>
                            setAssignment({ ...assignment, assigned_from: e.target.value })
                        }
                        className={styles.input}
                        required
                    />

                    <input
                        type="datetime-local"
                        value={assignment.assigned_to}
                        onChange={(e) =>
                            setAssignment({ ...assignment, assigned_to: e.target.value })
                        }
                        className={styles.input}
                    />

                    <input
                        type="number"
                        placeholder="Driver Credit Score"
                        value={assignment.driver_credit_score}
                        onChange={(e) =>
                            setAssignment({ ...assignment, driver_credit_score: e.target.value })
                        }
                        className={styles.input}
                        required
                    />

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={buttonDisabled}
                    >
                        {buttonDisabled ? "Fill required fields" : "Assign Driver"}
                    </button>

                    <Link href="/authentication/signin" className={styles.link}>
                        Back to Sign in
                    </Link>
                </form>
            </div>
        </div>
    );
}
