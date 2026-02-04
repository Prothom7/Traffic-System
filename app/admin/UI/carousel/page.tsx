'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./carousel.module.css"; // create CSS for styling

interface CarouselImage {
  _id: string;
  imageUrl: string;
  title?: string;
  description?: string;
}

export default function AdminCarouselPage() {
  const router = useRouter();
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ imageUrl, title, description }),
      });
      const data = await res.json();
      if (data.success) {
        setImages([data.data, ...images]);
        setImageUrl(""); setTitle(""); setDescription("");
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
    try {
      const res = await fetch(`/api/admin/UI/carousel/delete/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setImages(images.filter((img) => img._id !== id));
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Carousel Management</h1>

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
        <button onClick={addImage} disabled={loading}>
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
              <button onClick={() => deleteImage(img._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
