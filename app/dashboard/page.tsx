"use client";

import React, { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { useRouter } from "next/navigation";
import { decodeJWTClient } from "@/helpers/jwtClient";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";

interface CarouselImage {
  _id: string;
  imageUrl: string;
  title?: string;
  description?: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("User");
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  /* AUTH + USER */
  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    const decoded = decodeJWTClient(token);
    if (decoded?.name) setUserName(decoded.name);
  }, [router]);

  /* FETCH CAROUSEL */
  useEffect(() => {
    const fetchCarousel = async () => {
      try {
        const res = await fetch("/api/dashboard/carousel");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCarouselImages(data.data);
        }
      } catch (err) {
        console.error("Carousel fetch failed", err);
      }
    };
    fetchCarousel();
  }, []);

  /* AUTO SLIDE */
  useEffect(() => {
    if (!carouselImages.length) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === carouselImages.length - 1 ? 0 : prev + 1
      );
    }, 4500);

    return () => clearInterval(interval);
  }, [carouselImages]);

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <Header userName={userName} />

      {/* MAIN */}
      <main className={styles.main}>
        <section className={styles.welcomeSection}>
          <h1>Dashboard Overview</h1>
          <p>Manage vehicles, tickets, and stay updated</p>
        </section>

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>My Vehicles</h3>
            <p className={styles.statNumber}>3</p>
          </div>

          <div className={`${styles.statCard} ${styles.warning}`}>
            <h3>Active Tickets</h3>
            <p className={styles.statNumber}>2</p>
          </div>

          <div className={`${styles.statCard} ${styles.success}`}>
            <h3>Paid Tickets</h3>
            <p className={styles.statNumber}>5</p>
          </div>

          <div className={styles.statCard}>
            <h3>Total Fines</h3>
            <p className={styles.statNumber}>$450</p>
          </div>
        </section>

        {carouselImages.length > 0 && (
          <section className={styles.announcements}>
            <h2>Important Announcements</h2>
            <div className={styles.carousel}>
              {carouselImages.map((item, index) => (
                <div
                  key={item._id}
                  className={`${styles.carouselSlide} ${
                    index === currentSlide ? styles.active : ""
                  }`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title || "Announcement"}
                    className={styles.carouselImage}
                  />
                  {(item.title || item.description) && (
                    <div className={styles.carouselCaption}>
                      {item.title && <h3>{item.title}</h3>}
                      {item.description && <p>{item.description}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
