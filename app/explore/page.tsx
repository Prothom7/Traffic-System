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

  /* ---------------- AUTH & USER ---------------- */
  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    const decoded = decodeJWTClient(token);
    if (decoded?.name) {
      setUserName(decoded.name);
    }
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
      {/* SHARED HEADER */}
      <Header userName={userName} />

      {/* MAIN */}
      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <h1>Explore Traffic Management System</h1>
          <p>
            Discover comprehensive information about transportation safety,
            regulations, and services nationwide
          </p>
        </section>

        {/* NEWS CAROUSEL */}
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
                        "Stay informed about the latest transportation news and regulations"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.carouselPlaceholder}>
                <p>No news available at the moment</p>
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

        {/* INFO / SERVICES */}
        {/* (unchanged content below – your existing sections stay exactly same) */}
        {/* Vehicle Registration, Laws, Safety, Stats, Initiatives, Resources */}
      </main>

      {/* SHARED FOOTER */}
      <Footer />
    </div>
  );
}
