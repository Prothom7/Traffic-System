'use client';

import React, { useEffect, useState } from "react";
import styles from "./newsfeed.module.css";
import { useRouter } from "next/navigation";

interface NewsItem {
  _id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  source?: string;
  category?: string;
  readingTime?: string;
}

export default function NewsFeedAdmin() {
  const router = useRouter();
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [newItem, setNewItem] = useState<NewsItem>({
    title: "",
    description: "",
    imageUrl: "",
    source: "",
    category: "",
    readingTime: "",
  });
  const [loading, setLoading] = useState(false);

  // Fetch existing news items
  const fetchNews = async () => {
    try {
      const res = await fetch("/api/dashboard/newsfeed");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNewsFeed(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch news feed", err);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  // Add news item
  const addNews = async () => {
    if (!newItem.title || !newItem.description) {
      alert("Title and Description are required!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/UI/newsfeed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const data = await res.json();
      if (data.success) {
        setNewItem({
          title: "",
          description: "",
          imageUrl: "",
          source: "",
          category: "",
          readingTime: "",
        });
        fetchNews();
      } else {
        alert("Failed to add news item");
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Delete news item
  const deleteNews = async (id: string) => {
    if (!confirm("Are you sure you want to delete this news item?")) return;

    try {
      const res = await fetch(`/api/admin/newsfeed/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchNews();
      } else {
        alert("Failed to delete news item");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h1>News Feed Management</h1>

      {/* Add News Form */}
      <div className={styles.addForm}>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={newItem.title}
          onChange={handleChange}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={newItem.description}
          onChange={handleChange}
        />
        <input
          type="text"
          name="imageUrl"
          placeholder="Image URL"
          value={newItem.imageUrl}
          onChange={handleChange}
        />
        <input
          type="text"
          name="source"
          placeholder="Source"
          value={newItem.source}
          onChange={handleChange}
        />
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={newItem.category}
          onChange={handleChange}
        />
        <input
          type="text"
          name="readingTime"
          placeholder="Reading Time"
          value={newItem.readingTime}
          onChange={handleChange}
        />
        <button onClick={addNews} disabled={loading}>
          {loading ? "Adding..." : "Add News"}
        </button>
      </div>

      {/* Existing News Items */}
      <div className={styles.newsList}>
        {newsFeed.length === 0 ? (
          <p>No news items available.</p>
        ) : (
          newsFeed.map((news) => (
            <div key={news._id} className={styles.newsCard}>
              {news.imageUrl && <img src={news.imageUrl} alt={news.title} />}
              <div className={styles.newsContent}>
                <h3>{news.title}</h3>
                <p>{news.description}</p>
                <div className={styles.newsMeta}>
                  {news.source && <span>{news.source}</span>}
                  {news.category && <span> | {news.category}</span>}
                  {news.readingTime && <span> | {news.readingTime}</span>}
                </div>
              </div>
              <button className={styles.deleteButton} onClick={() => deleteNews(news._id!)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
