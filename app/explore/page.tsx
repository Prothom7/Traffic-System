"use client";

import React, { useEffect, useState } from "react";
import styles from "./explore.module.css";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { decodeJWTClient } from "@/helpers/jwtClient";

interface NewsItem {
  _id: string;
  imageUrl: string;
  title?: string;
  description?: string;
}

export default function ExplorePage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("User");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  /* ---------------- AUTH ---------------- */
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

  /* ---------------- FETCH NEWS ---------------- */
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/dashboard/newsfeed");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setNewsItems(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch news", e);
      }
    };

    fetchNews();
  }, []);

  /* ---------------- AUTO SLIDE ---------------- */
  useEffect(() => {
    if (!newsItems.length) return;

    const timer = setInterval(() => {
      setCurrentSlide((p) =>
        p === newsItems.length - 1 ? 0 : p + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [newsItems]);

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <Header userName={userName} />

      {/* 🔥 FULL WIDTH NEWS CAROUSEL */}
      <section className={styles.newsCarousel}>
        <h2>Latest News & Updates</h2>

        <div className={styles.carousel}>
          {newsItems.length > 0 ? (
            newsItems.map((item, index) => (
              <div
                key={item._id}
                className={`${styles.carouselSlide} ${
                  index === currentSlide ? styles.active : ""
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title || "News"}
                  className={styles.carouselImage}
                />

                <div className={styles.carouselCaption}>
                  <h3>{item.title || "Transportation Update"}</h3>
                  <p>
                    {item.description ||
                      "Stay informed about the latest transportation updates"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.carouselPlaceholder}>
              <p>No news available</p>
            </div>
          )}

          {newsItems.length > 1 && (
            <div className={styles.carouselDots}>
              {newsItems.map((_, index) => (
                <span
                  key={index}
                  className={`${styles.dot} ${
                    index === currentSlide ? styles.activeDot : ""
                  }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className={styles.main}>
        {/* HERO (NOW BELOW CAROUSEL) */}
        <section className={styles.hero}>
          <h1>Explore Traffic Management System</h1>
          <p>
            Discover comprehensive information about transportation safety,
            regulations, and services nationwide
          </p>
        </section>

        {/* SERVICE CARDS */}
        <section className={styles.servicesSection}>
          <h2>Our Services</h2>
          <div className={styles.serviceGrid}>
            <div className={styles.serviceCard} onClick={() => router.push("/services/renew-registration")}>
              <div className={styles.serviceIcon}>🔄</div>
              <h3>Renew Registration</h3>
              <p>Renew your vehicle registration online quickly and easily</p>
            </div>

            <div className={styles.serviceCard} onClick={() => router.push("/services/change-ownership")}>
              <div className={styles.serviceIcon}>👤</div>
              <h3>Change Ownership</h3>
              <p>Transfer vehicle ownership with our streamlined process</p>
            </div>

            <div className={styles.serviceCard} onClick={() => router.push("/services/update-details")}>
              <div className={styles.serviceIcon}>✏️</div>
              <h3>Update Details</h3>
              <p>Update your vehicle or owner information</p>
            </div>

            <div className={styles.serviceCard} onClick={() => router.push("/services/report-stolen")}>
              <div className={styles.serviceIcon}>🚨</div>
              <h3>Report Stolen Vehicle</h3>
              <p>Report a stolen vehicle to authorities immediately</p>
            </div>

            <div className={styles.serviceCard} onClick={() => router.push("/services/check-status")}>
              <div className={styles.serviceIcon}>📋</div>
              <h3>Check Status</h3>
              <p>View your vehicle's current registration status</p>
            </div>

            <div className={styles.serviceCard} onClick={() => router.push("/services/payment-history")}>
              <div className={styles.serviceIcon}>💳</div>
              <h3>Payment History</h3>
              <p>View all your transaction and payment records</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
