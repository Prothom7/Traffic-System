"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

interface Location {
  _id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  edges: [];
}

export default function AddCamera() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    location_name: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/camera");
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error("Error fetching locations:", error);
      alert("Failed to fetch locations");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.location_name || !formData.latitude || !formData.longitude) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        location_name: formData.location_name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        edges: [],
      };

      if (editingId) {
        // Update
        const response = await fetch(`/api/admin/camera/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to update");
        alert("Camera location updated successfully!");
      } else {
        // Create
        const response = await fetch("/api/admin/camera", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to create");
        alert("Camera location created successfully!");
      }

      setFormData({ location_name: "", latitude: "", longitude: "" });
      setEditingId(null);
      fetchLocations();
    } catch (error) {
      console.error("Error saving location:", error);
      alert("Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingId(location._id);
    setFormData({
      location_name: location.location_name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/camera/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");
      alert("Camera location deleted successfully!");
      fetchLocations();
    } catch (error) {
      console.error("Error deleting location:", error);
      alert("Failed to delete location");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ location_name: "", latitude: "", longitude: "" });
  };

  return (
    <div className={styles.fullpage}>
      <header className={styles.header}>
        <h1 className={styles.title}>Camera Management</h1>
        <nav className={styles.nav}>
          <button onClick={() => router.push("/admin")} className={styles.navButton}>
            Map
          </button>
          <button onClick={() => router.push("/admin/addCamera")} className={styles.navButton}>
            Add Camera
          </button>
          <button onClick={() => router.push("/admin/vehicles")} className={styles.navButton}>
            Vehicles
          </button>
          <button onClick={() => router.push("/admin/traffic-records")} className={styles.navButton}>
            Traffic Records
          </button>
          <button onClick={() => router.push("/admin/violations")} className={styles.navButton}>
            Violations
          </button>
          <button onClick={() => router.push("/admin/UI")} className={styles.navButton}>
            UI
          </button>
        </nav>
      </header>

      <main className={styles.container}>
        <h2 className={styles.sectionTitle}>
          {editingId ? "Edit Camera Location" : "Add New Camera Location"}
        </h2>

        <form onSubmit={handleSubmit} style={{ marginBottom: "40px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
              Location Name
            </label>
            <input
              type="text"
              name="location_name"
              value={formData.location_name}
              onChange={handleInputChange}
              placeholder="e.g., Traffic Light at Main Street"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "2px solid #ddd",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                Latitude
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="e.g., 23.75"
                step="0.0001"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #ddd",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                Longitude
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="e.g., 90.37"
                step="0.0001"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #ddd",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 24px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Saving..." : editingId ? "Update Location" : "Add Location"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#757575",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <h3 style={{ fontSize: "1.4rem", marginBottom: "16px", fontWeight: "700" }}>
          All Camera Locations ({locations.length})
        </h3>

        {loading && locations.length === 0 ? (
          <p>Loading locations...</p>
        ) : locations.length === 0 ? (
          <p>No camera locations found. Add one to get started!</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "700" }}>
                    Camera Name
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "700" }}>
                    Latitude
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "700" }}>
                    Longitude
                  </th>
                  <th style={{ padding: "12px", textAlign: "center", fontWeight: "700" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {locations.map((location) => (
                  <tr
                    key={location._id}
                    style={{
                      borderBottom: "1px solid #eee",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f9f9f9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "white")
                    }
                  >
                    <td style={{ padding: "12px" }}>{location.location_name}</td>
                    <td style={{ padding: "12px" }}>{location.latitude.toFixed(4)}</td>
                    <td style={{ padding: "12px" }}>{location.longitude.toFixed(4)}</td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        display: "flex",
                        gap: "8px",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => handleEdit(location)}
                        disabled={loading}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#2196F3",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          opacity: loading ? 0.6 : 1,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(location._id)}
                        disabled={loading}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#f44336",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          opacity: loading ? 0.6 : 1,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
