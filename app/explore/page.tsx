"use client";

import React, { useEffect, useState } from "react";
import styles from "./explore.module.css";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { decodeJWTClient, getValidAuthTokenClient } from "@/helpers/jwtClient";

interface NewsItem {
  _id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  source?: string;
}

export default function ExplorePage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("User");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    number_plate: "",
    chassis_number: "",
    vehicle_type: "Car",
    model: "",
    color: "",
    year_of_manufacture: new Date().getFullYear(),
    engine_type: "Petrol",
    registration_expiry: "",
  });

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    setMounted(true);

    const token = getValidAuthTokenClient();
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

  /* -------- ADD VEHICLE HANDLERS -------- */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = getValidAuthTokenClient();
      if (!token) {
        router.push("/authentication/signin");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/services/add-vehicle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Vehicle added successfully!");
        setFormData({
          number_plate: "",
          chassis_number: "",
          vehicle_type: "Car",
          model: "",
          color: "",
          year_of_manufacture: new Date().getFullYear(),
          engine_type: "Petrol",
          registration_expiry: "",
        });
        setShowAddVehicle(false);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Failed to add vehicle");
      }
    } catch (error) {
      console.error("Error adding vehicle:", error);
      setMessage("Error adding vehicle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <Header userName={userName} />

      {/* 🔥 FULL WIDTH NEWS CAROUSEL */}
      <section className={styles.newsCarousel}>
        <div className={styles.carousel}>
          <h2 className={styles.carouselTitle}>Latest News & Updates</h2>
          {newsItems.length > 0 ? (
            newsItems.map((item, index) => {
              const isExternal = item.source?.startsWith("http");
              const href = item.source || "#";

              return (
                <a
                  key={item._id}
                  href={href}
                  target={isExternal ? "_blank" : "_self"}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className={`${styles.carouselSlide} ${index === currentSlide ? styles.active : ""}`}
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
                </a>
              );
            })
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
        {/* HERO */}
        <section className={styles.hero}>
          <h1>Explore Traffic Management System</h1>
          <p>
            Discover comprehensive information about transportation safety,
            regulations, and services nationwide
          </p>
        </section>

        {/* ADD VEHICLE SECTION */}
        <section className={styles.addVehicleSection}>
          <div className={styles.addVehicleContainer}>
            <h2>Your Vehicles</h2>
            <button
              className={styles.addVehicleBtn}
              onClick={() => setShowAddVehicle(!showAddVehicle)}
            >
              {showAddVehicle ? "Cancel" : "+ Add New Vehicle"}
            </button>

            {showAddVehicle && (
              <form onSubmit={handleAddVehicle} className={styles.vehicleForm}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Number Plate *</label>
                    <input
                      type="text"
                      name="number_plate"
                      value={formData.number_plate}
                      onChange={handleInputChange}
                      placeholder="e.g., ABC-123"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Chassis Number *</label>
                    <input
                      type="text"
                      name="chassis_number"
                      value={formData.chassis_number}
                      onChange={handleInputChange}
                      placeholder="Chassis number"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Vehicle Type *</label>
                    <select
                      name="vehicle_type"
                      value={formData.vehicle_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Car">Car</option>
                      <option value="Truck">Truck</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Bus">Bus</option>
                      <option value="Van">Van</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Model *</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      placeholder="e.g., Honda Civic"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Color *</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      placeholder="e.g., Red"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Year of Manufacture *</label>
                    <input
                      type="number"
                      name="year_of_manufacture"
                      value={formData.year_of_manufacture}
                      onChange={handleInputChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Engine Type *</label>
                    <select
                      name="engine_type"
                      value={formData.engine_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="CNG">CNG</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Registration Expiry *</label>
                    <input
                      type="date"
                      name="registration_expiry"
                      value={formData.registration_expiry}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {message && (
                  <div className={styles.message}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? "Adding Vehicle..." : "Add Vehicle"}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* SERVICE CARDS */}
        <section className={styles.servicesSection}>
          <h2>Our Services</h2>
          <div className={styles.serviceGrid}>
            <div className={styles.serviceCard} onClick={() => router.push("/services/renew-registration")}>
              <div className={styles.serviceIcon}>
                <img src="/source/service_registration.jpg" alt="Renew Registration" />
              </div>
              <h3>Renew Registration</h3>
              <p>Renew your vehicle registration online quickly and easily</p>
            </div>

            <div className={styles.serviceCard} onClick={() => router.push("/services/change-ownership")}>
              <div className={styles.serviceIcon}>
                <img src="/source/service_ownership.jpg" alt="Change Ownership" />
              </div>
              <h3>Change Ownership</h3>
              <p>Transfer vehicle ownership with our streamlined process</p>
            </div>

            <div className={styles.serviceCard} onClick={() => router.push("/services/update-details")}>
              <div className={styles.serviceIcon}>
                <img src="/source/service_update.jpg" alt="Update Details" />
              </div>
              <h3>Update Details</h3>
              <p>Update your vehicle or owner information</p>
            </div>

            <div className={styles.serviceCard} onClick={() => router.push("/services/report-stolen")}>
              <div className={styles.serviceIcon}>
                <img src="/source/service_stolen.jpg" alt="Report Stolen Vehicle" />
              </div>
              <h3>Report Stolen Vehicle</h3>
              <p>Report a stolen vehicle to authorities immediately</p>
            </div>

            <div className={styles.serviceCard} onClick={() => router.push("/services/check-status")}>
              <div className={styles.serviceIcon}>
                <img src="/source/service_status.jpg" alt="Check Status" />
              </div>
              <h3>Check Status</h3>
              <p>View your vehicle&apos;s current registration status</p>
            </div>

            <div className={styles.serviceCard} onClick={() => router.push("/services/payment-history")}>
              <div className={styles.serviceIcon}>
                <img src="/source/service_payment.jpg" alt="Payment History" />
              </div>
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
