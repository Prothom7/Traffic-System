"use client";

import React, { useState, useEffect } from "react";
import styles from "./addCamera.module.css";
import AdminHeader from "../adminHeader";

interface Location {
  _id: string;
  location_name: string;
  latitude: number;
  longitude: number;
}

interface Edge {
  _id: string;
  to_location_id: string;
  to_location_name: string;
  distance_km: number;
}

export default function AddCamera() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingEdgesFor, setManagingEdgesFor] = useState<string | null>(null);
  const [currentEdges, setCurrentEdges] = useState<Edge[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Set<string>>(new Set());
  const [customDistances, setCustomDistances] = useState<Record<string, number>>({});
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

  const handleManageEdges = async (location: Location) => {
    setManagingEdgesFor(location._id);
    try {
      const res = await fetch(`/api/admin/edges?locationId=${location._id}`);
      const edges: Edge[] = await res.json();
      setCurrentEdges(edges);

      const selected = new Set(edges.map((e) => e.to_location_id));
      setSelectedEdges(selected);

      const distances: Record<string, number> = {};
      edges.forEach((e) => {
        distances[e.to_location_id] = e.distance_km;
      });
      setCustomDistances(distances);
    } catch (err) {
      console.error("Failed to fetch edges:", err);
      alert("Failed to load edges");
    }
  };

  const calculateDistance = (loc1: Location, loc2: Location) => {
    const toRad = (val: number) => (val * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(loc2.latitude - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(loc1.latitude)) *
        Math.cos(toRad(loc2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(3));
  };

  const toggleEdge = (toId: string) => {
    const newSelected = new Set(selectedEdges);
    if (newSelected.has(toId)) {
      newSelected.delete(toId);
    } else {
      newSelected.add(toId);
      if (!customDistances[toId]) {
        const from = locations.find((l) => l._id === managingEdgesFor)!;
        const to = locations.find((l) => l._id === toId)!;
        setCustomDistances((prev) => ({
          ...prev,
          [toId]: calculateDistance(from, to),
        }));
      }
    }
    setSelectedEdges(newSelected);
  };

  const handleDistanceChange = (toId: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setCustomDistances((prev) => ({ ...prev, [toId]: num }));
    }
  };

  const handleSaveEdges = async () => {
    if (!managingEdgesFor) return;

    const edges = Array.from(selectedEdges).map((toId) => ({
      to_location_id: toId,
      distance_km: customDistances[toId] || 0,
    }));

    try {
      setLoading(true);
      const res = await fetch("/api/admin/edges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_location_id: managingEdgesFor, edges }),
      });

      if (!res.ok) throw new Error("Failed to save edges");
      alert("Edges saved successfully!");
      setManagingEdgesFor(null);
      setCurrentEdges([]);
      setSelectedEdges(new Set());
      setCustomDistances({});
    } catch (err) {
      console.error(err);
      alert("Failed to save edges");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdges = () => {
    setManagingEdgesFor(null);
    setCurrentEdges([]);
    setSelectedEdges(new Set());
    setCustomDistances({});
  };

  const handleUncheckAll = () => {
    setSelectedEdges(new Set());
  };

  return (
    <div className={styles.fullpage}>
      <AdminHeader />

      <main className={styles.container}>
        <h2 className={styles.sectionTitle}>
          {editingId ? "Edit Camera Location" : "Add New Camera Location"}
        </h2>

        {managingEdgesFor && (
          <div
            style={{
              marginBottom: "40px",
              padding: "24px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <h3 style={{ fontSize: "1.3rem", marginBottom: "16px", fontWeight: "700" }}>
              Manage Edges for{" "}
              {locations.find((l) => l._id === managingEdgesFor)?.location_name}
            </h3>

            <div style={{ marginBottom: "20px" }}>
              {locations
                .filter((loc) => loc._id !== managingEdgesFor)
                .map((loc) => (
                  <div
                    key={loc._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                      padding: "10px",
                      backgroundColor: selectedEdges.has(loc._id)
                        ? "rgba(0, 170, 255, 0.1)"
                        : "transparent",
                      borderRadius: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEdges.has(loc._id)}
                      onChange={() => toggleEdge(loc._id)}
                      style={{ cursor: "pointer", transform: "scale(1.2)" }}
                    />
                    <label style={{ flex: 1, fontWeight: "500" }}>
                      {loc.location_name}
                    </label>
                    {selectedEdges.has(loc._id) && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.9rem" }}>Distance (km):</span>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={customDistances[loc._id] || 0}
                          onChange={(e) => handleDistanceChange(loc._id, e.target.value)}
                          style={{
                            width: "100px",
                            padding: "6px",
                            borderRadius: "6px",
                            border: "1px solid rgba(255, 255, 255, 0.3)",
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            color: "#fff",
                            fontSize: "0.95rem",
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleUncheckAll}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "transparent",
                  color: "rgba(255, 255, 255, 0.85)",
                  border: "none",
                  borderRadius: "999px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.25s ease, color 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                }}
              >
                Uncheck All
              </button>
              <button
                onClick={handleSaveEdges}
                disabled={loading}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "transparent",
                  color: "rgba(255, 255, 255, 0.85)",
                  border: "none",
                  borderRadius: "999px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "background-color 0.25s ease, color 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                }}
              >
                {loading ? "Saving..." : "Save Edges"}
              </button>
              <button
                onClick={handleCancelEdges}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "transparent",
                  color: "rgba(255, 255, 255, 0.85)",
                  border: "none",
                  borderRadius: "999px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.25s ease, color 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
                backgroundColor: "transparent",
                color: "rgba(255, 255, 255, 0.85)",
                border: "none",
                borderRadius: "999px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "background-color 0.25s ease, color 0.25s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
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
                  backgroundColor: "transparent",
                  color: "rgba(255, 255, 255, 0.85)",
                  border: "none",
                  borderRadius: "999px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.25s ease, color 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
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
                <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "700", color: "#fff" }}>
                    Camera Name
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "700", color: "#fff" }}>
                    Latitude
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "700", color: "#fff" }}>
                    Longitude
                  </th>
                  <th style={{ padding: "12px", textAlign: "center", fontWeight: "700", color: "#fff" }}>
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
                    }}
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
                          padding: "8px 16px",
                          backgroundColor: "transparent",
                          color: "rgba(255, 255, 255, 0.85)",
                          border: "none",
                          borderRadius: "999px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          opacity: loading ? 0.6 : 1,
                          transition: "background-color 0.25s ease, color 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                            e.currentTarget.style.color = "#ffffff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(location._id)}
                        disabled={loading}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "transparent",
                          color: "rgba(255, 255, 255, 0.85)",
                          border: "none",
                          borderRadius: "999px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          opacity: loading ? 0.6 : 1,
                          transition: "background-color 0.25s ease, color 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                            e.currentTarget.style.color = "#ffffff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                        }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleManageEdges(location)}
                        disabled={loading}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "transparent",
                          color: "rgba(255, 255, 255, 0.85)",
                          border: "none",
                          borderRadius: "999px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          opacity: loading ? 0.6 : 1,
                          transition: "background-color 0.25s ease, color 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                            e.currentTarget.style.color = "#ffffff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                        }}
                      >
                        Manage Edges
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
