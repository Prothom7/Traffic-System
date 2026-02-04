"use client";

import React, { useEffect, useState } from "react";
import styles from "./explore.module.css";
import { useRouter } from "next/navigation";

interface NewsItem {
  _id: string;
  imageUrl: string;
  title?: string;
  description?: string;
}

export default function ExplorePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  // ✅ Auth check
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("authToken");
    if (!token) router.push("/authentication/signin");
  }, [router]);

  // ✅ Fetch news feed
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/dashboard/newsfeed");
        const data = await res.json();
        if (data.success) setNewsItems(data.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchNews();
  }, []);

  // ✅ Auto slide for news carousel
  useEffect(() => {
    if (!newsItems.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((p) => (p === newsItems.length - 1 ? 0 : p + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [newsItems]);

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
          <li className={styles.active}>Explore</li>
          <li onClick={() => router.push("/dashboard")}>Dashboard</li>
          <li>My Vehicles</li>
          <li>Tickets & Violations</li>
          <li>Reports</li>
          <li>Profile</li>
        </ul>
      </nav>

      {/* MAIN */}
      <main className={styles.main}>
        {/* HERO SECTION */}
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

        {/* INFORMATION SECTIONS */}
        <section className={styles.infoSection}>
          <h2>Services & Information</h2>

          <div className={styles.infoCardWithImage}>
            <div className={styles.infoImageContainer}>
              <img
                src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop"
                alt="Vehicle Registration"
                className={styles.infoImage}
              />
            </div>
            <div className={styles.infoContent}>
              <h3>Vehicle Registration</h3>
              <p>
                Register your vehicle, renew registration, and access vehicle
                documentation online. Quick and secure processing for all
                vehicle types including cars, motorcycles, trucks, and
                commercial vehicles.
              </p>
              <ul className={styles.featureList}>
                <li>Online registration renewal</li>
                <li>Digital documentation access</li>
                <li>Real-time status updates</li>
              </ul>
              <button className={styles.learnMore}>Learn More →</button>
            </div>
          </div>

          <div className={`${styles.infoCardWithImage} ${styles.reverse}`}>
            <div className={styles.infoImageContainer}>
              <img
                src="https://images.unsplash.com/photo-1593642532400-2682810df593?w=600&h=400&fit=crop"
                alt="Traffic Laws"
                className={styles.infoImage}
              />
            </div>
            <div className={styles.infoContent}>
              <h3>Traffic Laws & Regulations</h3>
              <p>
                Stay informed about traffic laws, speed limits, parking
                regulations, and safety requirements in your area. Access the
                complete traffic code and understand your rights and
                responsibilities.
              </p>
              <ul className={styles.featureList}>
                <li>Complete traffic law database</li>
                <li>Regional regulation updates</li>
                <li>Violation penalties guide</li>
              </ul>
              <button className={styles.learnMore}>Learn More →</button>
            </div>
          </div>

          <div className={styles.infoCardWithImage}>
            <div className={styles.infoImageContainer}>
              <img
                src="https://images.unsplash.com/photo-1569098644584-210bcd375b59?w=600&h=400&fit=crop"
                alt="Safety Programs"
                className={styles.infoImage}
              />
            </div>
            <div className={styles.infoContent}>
              <h3>Safety Programs</h3>
              <p>
                Access educational resources, safety tips, and programs designed
                to promote safe driving and reduce accidents. Join community
                initiatives and defensive driving courses.
              </p>
              <ul className={styles.featureList}>
                <li>Free safety education courses</li>
                <li>Community awareness programs</li>
                <li>Accident prevention resources</li>
              </ul>
              <button className={styles.learnMore}>Learn More →</button>
            </div>
          </div>

          <div className={`${styles.infoCardWithImage} ${styles.reverse}`}>
            <div className={styles.infoImageContainer}>
              <img
                src="https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=600&h=400&fit=crop"
                alt="Traffic Statistics"
                className={styles.infoImage}
              />
            </div>
            <div className={styles.infoContent}>
              <h3>Traffic Statistics</h3>
              <p>
                View real-time traffic data, accident reports, and
                transportation statistics to stay informed about road
                conditions. Access historical data and traffic pattern analysis.
              </p>
              <ul className={styles.featureList}>
                <li>Real-time traffic monitoring</li>
                <li>Accident statistics & trends</li>
                <li>Road condition reports</li>
              </ul>
              <button className={styles.learnMore}>Learn More →</button>
            </div>
          </div>
        </section>

        {/* PRIORITY INITIATIVES */}
        <section className={styles.initiatives}>
          <h2>National Transportation Priorities</h2>
          <div className={styles.initiativesList}>
            <div className={styles.initiativeItem}>
              <div className={styles.initiativeNumber}>01</div>
              <div className={styles.initiativeContent}>
                <h3>Zero Traffic Fatalities</h3>
                <p>
                  Working towards eliminating traffic-related deaths through
                  enhanced safety measures, better infrastructure, and public
                  awareness campaigns.
                </p>
              </div>
            </div>

            <div className={styles.initiativeItem}>
              <div className={styles.initiativeNumber}>02</div>
              <div className={styles.initiativeContent}>
                <h3>Smart Transportation</h3>
                <p>
                  Implementing intelligent transportation systems, connected
                  vehicles, and innovative technologies to improve traffic flow
                  and safety.
                </p>
              </div>
            </div>

            <div className={styles.initiativeItem}>
              <div className={styles.initiativeNumber}>03</div>
              <div className={styles.initiativeContent}>
                <h3>Infrastructure Modernization</h3>
                <p>
                  Upgrading roads, bridges, and transportation networks to meet
                  modern safety standards and accommodate growing traffic
                  demands.
                </p>
              </div>
            </div>

            <div className={styles.initiativeItem}>
              <div className={styles.initiativeNumber}>04</div>
              <div className={styles.initiativeContent}>
                <h3>Environmental Sustainability</h3>
                <p>
                  Promoting eco-friendly transportation options, reducing
                  emissions, and supporting electric vehicle adoption for a
                  cleaner future.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RESOURCES SECTION */}
        <section className={styles.resources}>
          <h2>Quick Resources</h2>
          <div className={styles.resourcesGrid}>
            <div className={styles.resourceCard}>
              <h4>Mobile App</h4>
              <p>Download our mobile app for on-the-go access</p>
            </div>
            <div className={styles.resourceCard}>
              <h4>Contact Support</h4>
              <p>24/7 customer support for all your queries</p>
            </div>
            <div className={styles.resourceCard}>
              <h4>Documentation</h4>
              <p>Access guides, forms, and official documents</p>
            </div>
            <div className={styles.resourceCard}>
              <h4>Alerts</h4>
              <p>Subscribe to traffic alerts and notifications</p>
            </div>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLeft}>
            <h3> Traffic Management System</h3>
            <p>
              Ensuring safer roads through smart monitoring, transparent
              enforcement, and digital services.
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
