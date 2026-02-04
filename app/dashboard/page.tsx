"use client";

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
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);

  // ✅ Auth check
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("authToken");
    if (!token) router.push("/authentication/signin");
  }, [router]);

  // ✅ Fetch carousel
  useEffect(() => {
    const fetchCarousel = async () => {
      try {
        const res = await fetch("/api/dashboard/carousel");
        const data = await res.json();
        if (data.success) setCarouselImages(data.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCarousel();
  }, []);

  // ✅ Auto slide
  useEffect(() => {
    if (!carouselImages.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((p) => (p === carouselImages.length - 1 ? 0 : p + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [carouselImages]);

  const logout = () => {
    localStorage.clear();
    router.push("/authentication/signin");
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.topbar}>
        <div className={styles.logo}> Traffic Management System</div>
        <div className={styles.headerRight}>
          <span className={styles.userName}>Welcome, User</span>
          <button onClick={logout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {/* NAV */}
      <nav className={styles.navBar}>
        <ul>
          <li onClick={() => router.push("/explore")}>Explore</li>
          <li className={styles.active}>Dashboard</li>
          <li>My Vehicles</li>
          <li>Tickets & Violations</li>
          <li>Reports</li>
          <li>Profile</li>
        </ul>
      </nav>

      {/* MAIN */}
      <main className={styles.main}>
        {/* WELCOME SECTION */}
        <section className={styles.welcomeSection}>
          <h1>Dashboard Overview</h1>
          <p>
            Manage your vehicles, view tickets, and stay updated on traffic
            violations
          </p>
        </section>

        {/* STATS CARDS */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}></div>
            <div className={styles.statContent}>
              <h3>My Vehicles</h3>
              <p className={styles.statNumber}>3</p>
              <span className={styles.statLabel}>Registered</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.warning}`}>
            <div className={styles.statIcon}></div>
            <div className={styles.statContent}>
              <h3>Active Tickets</h3>
              <p className={styles.statNumber}>2</p>
              <span className={styles.statLabel}>Pending Payment</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.success}`}>
            <div className={styles.statIcon}>✓</div>
            <div className={styles.statContent}>
              <h3>Paid Tickets</h3>
              <p className={styles.statNumber}>5</p>
              <span className={styles.statLabel}>All Time</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}></div>
            <div className={styles.statContent}>
              <h3>Total Fines</h3>
              <p className={styles.statNumber}>$450</p>
              <span className={styles.statLabel}>Outstanding</span>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className={styles.quickActions}>
          <h2>Quick Actions</h2>
          <div className={styles.actionGrid}>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}></span>
              Register Vehicle
            </button>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}></span>
              Pay Tickets
            </button>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}></span>
              View Reports
            </button>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}></span>
              Notifications
            </button>
          </div>
        </section>

        {/* TWO COLUMN LAYOUT */}
        <div className={styles.twoColumnLayout}>
          {/* RECENT TICKETS */}
          <section className={styles.recentTickets}>
            <h2>Recent Tickets & Violations</h2>
            <div className={styles.ticketList}>
              <div className={styles.ticketItem}>
                <div className={styles.ticketLeft}>
                  <span className={`${styles.ticketStatus} ${styles.unpaid}`}>
                    Unpaid
                  </span>
                  <div className={styles.ticketDetails}>
                    <h4>Speeding Violation</h4>
                    <p>License Plate: ABC-1234</p>
                    <p className={styles.ticketDate}>Jan 28, 2026</p>
                  </div>
                </div>
                <div className={styles.ticketRight}>
                  <p className={styles.ticketAmount}>$150</p>
                  <button className={styles.payButton}>Pay Now</button>
                </div>
              </div>

              <div className={styles.ticketItem}>
                <div className={styles.ticketLeft}>
                  <span className={`${styles.ticketStatus} ${styles.unpaid}`}>
                    Unpaid
                  </span>
                  <div className={styles.ticketDetails}>
                    <h4>Parking Violation</h4>
                    <p>License Plate: ABC-1234</p>
                    <p className={styles.ticketDate}>Jan 25, 2026</p>
                  </div>
                </div>
                <div className={styles.ticketRight}>
                  <p className={styles.ticketAmount}>$75</p>
                  <button className={styles.payButton}>Pay Now</button>
                </div>
              </div>

              <div className={styles.ticketItem}>
                <div className={styles.ticketLeft}>
                  <span className={`${styles.ticketStatus} ${styles.paid}`}>
                    Paid
                  </span>
                  <div className={styles.ticketDetails}>
                    <h4>Red Light Violation</h4>
                    <p>License Plate: XYZ-5678</p>
                    <p className={styles.ticketDate}>Jan 15, 2026</p>
                  </div>
                </div>
                <div className={styles.ticketRight}>
                  <p className={styles.ticketAmount}>$200</p>
                </div>
              </div>
            </div>
            <button className={styles.viewAllButton}>View All Tickets</button>
          </section>

          {/* MY VEHICLES */}
          <section className={styles.myVehicles}>
            <h2>My Vehicles</h2>
            <div className={styles.vehicleList}>
              <div className={styles.vehicleCard}>
                <div className={styles.vehicleIcon}></div>
                <div className={styles.vehicleInfo}>
                  <h4>Toyota Camry 2022</h4>
                  <p>ABC-1234</p>
                  <span className={`${styles.vehicleStatus} ${styles.active}`}>
                    Active
                  </span>
                </div>
              </div>

              <div className={styles.vehicleCard}>
                <div className={styles.vehicleIcon}></div>
                <div className={styles.vehicleInfo}>
                  <h4>Honda CR-V 2021</h4>
                  <p>XYZ-5678</p>
                  <span className={`${styles.vehicleStatus} ${styles.active}`}>
                    Active
                  </span>
                </div>
              </div>

              <div className={styles.vehicleCard}>
                <div className={styles.vehicleIcon}></div>
                <div className={styles.vehicleInfo}>
                  <h4>Yamaha MT-07 2023</h4>
                  <p>MNO-9012</p>
                  <span className={`${styles.vehicleStatus} ${styles.active}`}>
                    Active
                  </span>
                </div>
              </div>
            </div>
            <button className={styles.viewAllButton}>Manage Vehicles</button>
          </section>
        </div>

        {/* ANNOUNCEMENTS */}
        {carouselImages.length > 0 && (
          <section className={styles.announcements}>
            <h2>Important Announcements</h2>
            <div className={styles.carousel}>
              {carouselImages.map((img, index) => (
                <div
                  key={img._id}
                  className={`${styles.carouselSlide} ${
                    index === currentSlide ? styles.active : ""
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.title || "Slide"}
                    className={styles.carouselImage}
                  />
                  {(img.title || img.description) && (
                    <div className={styles.carouselCaption}>
                      <h3>{img.title}</h3>
                      <p>{img.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      {/* FOOTER */}
<footer className={styles.footer}>
  <div className={styles.footerContent}>
    <div className={styles.footerLeft}>
      <h3> Traffic Management System</h3>
      <p>
        Ensuring safer roads through smart monitoring, transparent enforcement,
        and digital services.
      </p>
    </div>

    <div className={styles.footerLinks}>
      <a href="#">Privacy Policy</a>
      <a href="#">Terms of Service</a>
      <a href="#">Help Center</a>
      <a href="#">Contact</a>
    </div>
  </div>

  <div className={styles.footerBottom}>
    © {new Date().getFullYear()} Traffic Management System. All rights
    reserved.
  </div>
</footer>

    </div>
  );
}
