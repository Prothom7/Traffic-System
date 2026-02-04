'use client';

import React, { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { useRouter } from "next/navigation";

interface CarouselImage {
  _id: string;
  imageUrl: string;
  title?: string;
  description?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);

  // ✅ Check authentication on mount
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("authToken");
    const name = localStorage.getItem("authName") || "Vehicle Owner";

    if (!token) {
      router.push("/authentication/signin");
    } else {
      setUserName(name);
    }
  }, [router]);

  // ✅ Fetch carousel images from API
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch("/api/dashboard/carousel");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCarouselImages(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch carousel images", err);
      }
    };
    fetchImages();
  }, []);

  // ✅ Auto-slide carousel safely
  useEffect(() => {
    if (!carouselImages || carouselImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === carouselImages.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [carouselImages]);

  // ✅ Logout
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authName");
    router.push("/authentication/signin");
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.topbar}>
        <div className={styles.logo}>National Transportation Portal</div>
        <button className={styles.logoutButton} onClick={logout}>
          Logout
        </button>
      </header>

      {/* Top Navigation */}
      <nav className={styles.navBar}>
        <ul>
          <li className={styles.active}>Dashboard</li>
          <li>My Vehicles</li>
          <li>Registrations</li>
          <li>Reports</li>
          <li>Profile</li>
        </ul>
      </nav>

      {/* Carousel */}
      <section className={styles.carousel}>
        {carouselImages.map((item, index) => (
          <div
            key={item._id}
            className={`${styles.carouselSlide} ${
              index === currentSlide ? styles.active : ""
            }`}
          >
            <img
              src={item.imageUrl}
              alt={item.title || "Carousel image"}
              className={styles.carouselImage}
            />
            {(item.title || item.description) && (
              <div className={styles.carouselCaption}>
                {item.title && <h2>{item.title}</h2>}
                {item.description && <p>{item.description}</p>}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Main Content */}
      <main className={styles.main}>
        <h1>Welcome, {userName}</h1>
        <p className={styles.subtitle}>
          Official vehicle and transportation management dashboard
        </p>

        <div className={styles.cards}>
          <div className={styles.card}>
            <h2>Registered Vehicles</h2>
            <p className={styles.stat}>09</p>
          </div>

          <div className={styles.card}>
            <h2>Active Status</h2>
            <p className={styles.statGreen}>Verified</p>
          </div>

          <div className={styles.card}>
            <h2>Pending Actions</h2>
            <p className={styles.statWarning}>1</p>
          </div>
        </div>
      </main>
    </div>
  );
}
