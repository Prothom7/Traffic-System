'use client';

import React, { useEffect, useState } from "react";
import styles from './signin.module.css';
import Link from "next/link";

export default function LoginPage() {
    const [user, setUser] = useState({
        email: "",
        password: "",
    });

    const [buttonDisabled, setButtonDisabled] = useState(true);

    useEffect(() => {
        setButtonDisabled(!(user.email && user.password));
    }, [user]);

    const onLogin = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Email: ${user.email}\nPassword: ${user.password}`);
    };

    return (
        <div className={styles.fullpage}>
            <div className={styles.container}>
                <h2 className={styles.title}>Sign in</h2>
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
                        disabled={buttonDisabled}
                    >
                        {buttonDisabled ? "Fill all fields" : "Log In"}
                    </button>
                    <Link href="/signup" className={styles.link}>
                        Don't have an account?
                    </Link>
                </form>
            </div>
        </div>
    );
}
