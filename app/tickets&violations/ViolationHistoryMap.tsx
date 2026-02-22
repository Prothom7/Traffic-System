"use client";

import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";

interface ViolationPoint {
  _id: string;
  violation_type?: string;
  location_name?: string;
  latitude: number;
  longitude: number;
  date?: string;
}

interface ViolationHistoryMapProps {
  points: ViolationPoint[];
  mode: "markers" | "clusters" | "heatmap";
}

const defaultCenter: [number, number] = [23.75, 90.37];

interface ClusterPoint {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  violations: string[];
}

function getClusteredPoints(points: ViolationPoint[], cellSize = 0.02): ClusterPoint[] {
  const clusters = new Map<string, ClusterPoint>();

  points.forEach((point) => {
    const latCell = Math.floor(point.latitude / cellSize);
    const lngCell = Math.floor(point.longitude / cellSize);
    const key = `${latCell}:${lngCell}`;

    const existing = clusters.get(key);
    if (!existing) {
      clusters.set(key, {
        id: key,
        latitude: point.latitude,
        longitude: point.longitude,
        count: 1,
        violations: [point.violation_type || "Violation"],
      });
      return;
    }

    const nextCount = existing.count + 1;
    existing.latitude = (existing.latitude * existing.count + point.latitude) / nextCount;
    existing.longitude = (existing.longitude * existing.count + point.longitude) / nextCount;
    existing.count = nextCount;
    existing.violations.push(point.violation_type || "Violation");
  });

  return Array.from(clusters.values());
}

export default function ViolationHistoryMap({ points, mode }: ViolationHistoryMapProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const clusteredPoints = useMemo(() => getClusteredPoints(points), [points]);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    const map = L.map(mapNodeRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(defaultCenter, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      layerGroup.clearLayers();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (!points.length) {
      map.setView(defaultCenter, 12);
      return;
    }

    if (mode === "markers") {
      points.forEach((point) => {
        const marker = L.circleMarker([point.latitude, point.longitude], {
          radius: 7,
          color: "#60a5fa",
          weight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 0.65,
        });

        marker.bindPopup(
          `<div><strong>${point.violation_type || "Violation"}</strong><div>${point.location_name || "Unknown location"}</div><div>${point.date ? new Date(point.date).toLocaleString() : "Date unavailable"}</div></div>`
        );
        marker.addTo(layerGroup);
      });
    }

    if (mode === "clusters") {
      clusteredPoints.forEach((cluster) => {
        const marker = L.circleMarker([cluster.latitude, cluster.longitude], {
          radius: Math.min(10 + cluster.count * 1.5, 24),
          color: "#22d3ee",
          weight: 2,
          fillColor: "#06b6d4",
          fillOpacity: 0.55,
        });

        marker.bindPopup(`<div><strong>${cluster.count} violation(s)</strong><div>Area cluster</div></div>`);
        marker.addTo(layerGroup);
      });
    }

    if (mode === "heatmap") {
      clusteredPoints.forEach((cluster) => {
        const marker = L.circleMarker([cluster.latitude, cluster.longitude], {
          radius: Math.min(16 + cluster.count * 2.5, 38),
          color: "#fb7185",
          weight: 1,
          fillColor: "#ef4444",
          fillOpacity: Math.min(0.2 + cluster.count * 0.08, 0.75),
        });

        marker.bindPopup(`<div><strong>Hotspot: ${cluster.count} violation(s)</strong></div>`);
        marker.addTo(layerGroup);
      });
    }

    const bounds = L.latLngBounds(points.map((point) => [point.latitude, point.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }, [points, mode, clusteredPoints]);

  return (
    <div style={{ height: "340px", width: "100%", borderRadius: "14px", overflow: "hidden" }}>
      <div ref={mapNodeRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
