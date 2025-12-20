'use client';
import React, { useEffect, useState } from "react";
import styles from './signup.module.css';
import Link from "next/link";

export default function SignupPage() {
    const [user, setUser] = useState({
        username: "",
        email: "",
        password: ""
    });

    const [buttonDisabled, setButtonDisabled] = useState(true);

    useEffect(() => {
        setButtonDisabled(!(user.username && user.email && user.password));
    }, [user]);

    const onSignup = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Username: ${user.username}\nEmail: ${user.email}\nPassword: ${user.password}`);
    };

    return (
        <div className={styles.fullpage}>
            <div className={styles.container}>
                <h2 className={styles.title}>Sign Up</h2>
                <form onSubmit={onSignup} className={styles.form}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={user.username}
                        onChange={(e) => setUser({ ...user, username: e.target.value })}
                        className={styles.input}
                        required
                    />
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
                        disabled={buttonDisabled}
                    >
                        {buttonDisabled ? "Fill all fields" : "Sign Up"}
                    </button>
                    <Link href="/authentication/signin" className={styles.link}>
                        Already have an account?
                    </Link>
                </form>
            </div>
        </div>
    );
}
