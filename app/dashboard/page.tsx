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

interface NotificationItem {
  _id: string;
  number_plate: string;
  violation_type: string;
  cause: string;
  camera_location: string;
  message: string;
  createdAt: string;
}

interface DashboardStats {
  myVehicles: number;
  activeTickets: number;
  paidTickets: number;
  totalFines: number;
}

export default function DashboardPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("User");
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationError, setNotificationError] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    myVehicles: 0,
    activeTickets: 0,
    paidTickets: 0,
    totalFines: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  /* AUTH + USER */
  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/authentication/signin");
      return;
    }

    setAuthToken(token);

    const decoded = decodeJWTClient(token);
    if (decoded?.name) setUserName(decoded.name);
  }, [router]);

  /* FETCH DASHBOARD STATS */
  useEffect(() => {
    if (!authToken) return;

    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const response = await fetch("/api/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });

        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [authToken]);

  /* FETCH NOTIFICATIONS */
  useEffect(() => {
    if (!authToken) return;

    let isActive = true;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications?token=${encodeURIComponent(authToken)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch notifications");

        if (!isActive) return;
        setNotifications(data.notifications || []);
        setNotificationsEnabled(data.notificationsEnabled !== false);
      } catch (err: any) {
        console.error("Notifications fetch failed", err);
        if (!isActive) return;
        setNotificationError(err.message || "Failed to load notifications");
      }
    };

    fetchNotifications();

    return () => {
      isActive = false;
    };
  }, [authToken]);

  /* SUBSCRIBE TO VIOLATION EVENTS */
  useEffect(() => {
    if (!authToken || !notificationsEnabled) return;

    const source = new EventSource(
      `/api/notifications/stream?token=${encodeURIComponent(authToken)}`
    );

    const onViolation = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as NotificationItem;
        setNotifications((prev) => [payload, ...prev].slice(0, 20));
      } catch (err) {
        console.error("Notification parse failed", err);
      }
    };

    source.addEventListener("violation", onViolation as EventListener);
    source.onerror = () => {
      source.close();
    };

    return () => {
      source.removeEventListener("violation", onViolation as EventListener);
      source.close();
    };
  }, [authToken, notificationsEnabled]);

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
            <p className={styles.statNumber}>{statsLoading ? "-" : stats.myVehicles}</p>
          </div>

          <div className={`${styles.statCard} ${styles.warning}`}>
            <h3>Active Tickets</h3>
            <p className={styles.statNumber}>{statsLoading ? "-" : stats.activeTickets}</p>
          </div>

          <div className={`${styles.statCard} ${styles.success}`}>
            <h3>Paid Tickets</h3>
            <p className={styles.statNumber}>{statsLoading ? "-" : stats.paidTickets}</p>
          </div>

          <div className={styles.statCard}>
            <h3>Total Fines</h3>
            <p className={styles.statNumber}>{statsLoading ? "-" : `$${stats.totalFines.toFixed(2)}`}</p>
          </div>
        </section>

        <section className={styles.notificationsSection}>
          <div className={styles.notificationsHeader}>
            <h2>Notifications</h2>
            <span className={styles.notificationStatus}>
              {notificationsEnabled ? "On" : "Off"}
            </span>
          </div>

          {notificationError && (
            <p className={styles.notificationError}>{notificationError}</p>
          )}

          {!notificationsEnabled && (
            <p className={styles.notificationEmpty}>
              Notifications are turned off for this vehicle.
            </p>
          )}

          {notificationsEnabled && notifications.length === 0 && !notificationError && (
            <p className={styles.notificationEmpty}>No notifications yet.</p>
          )}

          {notificationsEnabled && notifications.length > 0 && (
            <ul className={styles.notificationsList}>
              {notifications.map((notice) => (
                <li key={notice._id} className={styles.notificationItem}>
                  <div className={styles.notificationTitle}>{notice.message}</div>
                  <div className={styles.notificationMeta}>
                    {notice.number_plate} | {notice.violation_type} | {notice.cause} | {notice.camera_location || "Unknown"}
                  </div>
                  <div className={styles.notificationTime}>
                    {new Date(notice.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
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
