'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./carousel.module.css";
import AdminHeader from "../../adminHeader";

interface CarouselImage {
  _id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  category: string;
}

const CAROUSEL_CATEGORIES = [
  "general",
  "perfect_credit",
  "good_credit",
  "fair_credit",
  "low_credit",
  "expired_registration",
  "expiring_soon",
  "pending_tickets",
  "active_violations",
  "paid_tickets",
  "clean_record",
  "good_standing",
] as const;

export default function AdminCarouselPage() {
  const router = useRouter();
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CAROUSEL_CATEGORIES)[number]>("general");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchImages = async () => {
    try {
      const res = await fetch("/api/dashboard/carousel");
      const data = await res.json();
      if (data.success) setImages(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const addImage = async () => {
    if (!imageUrl) return alert("Image URL is required");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/UI/carousel/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, title, description, category }),
      });
      const data = await res.json();
      if (data.success) {
        setImages((prev) => [data.data, ...prev]);
        setImageUrl(""); setTitle(""); setDescription(""); setCategory("general");
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/UI/carousel/delete/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setImages((prev) => prev.filter((img) => img._id !== id));
      } else {
        alert(data.error || "Failed to delete image");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete image");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.fullpage}>
      <AdminHeader />
      <main className={styles.container}>
        <h1 className={styles.title}>Carousel Management</h1>

      <div className={styles.form}>
        <input
          type="text"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value as (typeof CAROUSEL_CATEGORIES)[number])}>
          {CAROUSEL_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button className={styles.actionButton} onClick={addImage} disabled={loading}>
          {loading ? "Adding..." : "Add Image"}
        </button>
      </div>

      <div className={styles.imageList}>
        {images.map((img) => (
          <div key={img._id} className={styles.imageCard}>
            <img src={img.imageUrl} alt={img.title || "Carousel"} />
            <div className={styles.info}>
              <h3>{img.title}</h3>
              <p>{img.description}</p>
              <p>Category: {img.category || "general"}</p>
              <button
                className={styles.deleteButton}
                onClick={() => deleteImage(img._id)}
                disabled={deletingId === img._id}
              >
                {deletingId === img._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
      </main>
    </div>
  );
}
