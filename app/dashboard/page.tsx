"use client";

import React, { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { useRouter } from "next/navigation";
import { decodeJWTClient, getValidAuthTokenClient } from "@/helpers/jwtClient";
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

interface UserStatus {
  creditScore: number;
  expiredRegistrations: number;
  expiringRegistrations: number;
  carouselCategory: string;
}

interface DashboardStats {
  myVehicles: number;
  activeTickets: number;
  paidTickets: number;
  totalFines: number;
  activeTicketDetails: ActiveTicketDetail[];
  userStatus?: UserStatus;
}

interface ActiveTicketDetail {
  _id: string;
  number_plate: string;
  violation_type: string;
  fine_amount: number;
  status: string;
  timestamp: string;
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
    totalFines: 0,
    activeTicketDetails: [],
    userStatus: undefined,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [carouselLoading, setCarouselLoading] = useState(true);

  /* AUTH + USER */
  useEffect(() => {
    setMounted(true);

    const token = getValidAuthTokenClient();
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

  const handleNotificationToggle = async () => {
    if (!authToken || notificationSaving) return;

    const nextValue = !notificationsEnabled;
    setNotificationSaving(true);
    setNotificationError("");

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ notificationsEnabled: nextValue }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update notification settings");
      }

      setNotificationsEnabled(data.notificationsEnabled);
      if (!data.notificationsEnabled) {
        setNotifications([]);
      }
    } catch (err: any) {
      setNotificationError(err.message || "Failed to update notification settings");
    } finally {
      setNotificationSaving(false);
    }
  };

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

  /* FETCH PERSONALIZED CAROUSEL */
  useEffect(() => {
    if (!authToken) return;

    const fetchCarousel = async () => {
      setCarouselLoading(true);
      try {
        const res = await fetch("/api/dashboard/carousel-by-category", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCarouselImages(data.data);
          setCurrentSlide(0);
        } else {
          setCarouselImages([]);
        }
      } catch (err) {
        console.error("Carousel fetch failed", err);
        setCarouselImages([]);
      } finally {
        setCarouselLoading(false);
      }
    };
    fetchCarousel();
  }, [authToken]);

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

      {/* TOP FULL-WIDTH ANNOUNCEMENT CAROUSEL */}
      {carouselImages.length > 0 && (
        <section className={styles.newsCarousel}>
          <div className={styles.carousel}>
            <h2 className={styles.carouselTitle}>Important Announcements</h2>

            {carouselImages.map((item, index) => (
              <div
                key={item._id}
                className={`${styles.carouselSlide} ${index === currentSlide ? styles.active : ""}`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title || "Announcement"}
                  className={styles.carouselImage}
                />

                <div className={styles.carouselCaption}>
                  <h3>{item.title || "Traffic Update"}</h3>
                  <p>
                    {item.description ||
                      "Stay updated with the latest traffic system announcements."}
                  </p>
                </div>
              </div>
            ))}

            {carouselImages.length > 1 && (
              <div className={styles.carouselDots}>
                {carouselImages.map((_, index) => (
                  <span
                    key={index}
                    className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ""}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

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
            <p className={styles.statNumber}>{statsLoading ? "-" : `৳${stats.totalFines.toFixed(2)}`}</p>
          </div>
        </section>

        <section className={styles.notificationsSection}>
          <div className={styles.notificationsHeader}>
            <h2>Notifications</h2>
            <div className={styles.notificationControls}>
              <span className={styles.notificationStatus}>
                {notificationsEnabled ? "On" : "Off"}
              </span>
              <button
                type="button"
                className={styles.notificationToggleBtn}
                onClick={handleNotificationToggle}
                disabled={notificationSaving}
              >
                {notificationSaving
                  ? "Saving..."
                  : notificationsEnabled
                  ? "Turn Off"
                  : "Turn On"}
              </button>
            </div>
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

        <section className={styles.activeTicketsSection}>
          <h2>Active Tickets by Vehicle</h2>

          {statsLoading && <p className={styles.notificationEmpty}>Loading active tickets...</p>}

          {!statsLoading && stats.activeTicketDetails.length === 0 && (
            <p className={styles.notificationEmpty}>No active tickets found.</p>
          )}

          {!statsLoading && stats.activeTicketDetails.length > 0 && (
            <ul className={styles.notificationsList}>
              {stats.activeTicketDetails.map((ticket) => (
                <li key={ticket._id} className={styles.notificationItem}>
                  <div className={styles.notificationTitle}>
                    {ticket.violation_type} — {ticket.number_plate}
                  </div>
                  <div className={styles.notificationMeta}>
                    Status: {ticket.status} | Fine: ${ticket.fine_amount.toFixed(2)}
                  </div>
                  <div className={styles.notificationTime}>
                    {new Date(ticket.timestamp).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
