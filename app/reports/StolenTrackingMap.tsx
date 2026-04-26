"use client";

import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type TrackingPoint = {
  latitude: number;
  longitude: number;
  eta?: string;
  step?: number;
  timestamp?: string;
  location_name?: string;
};

type AdjacentNode = {
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  distance_km: number;
};

type TrackingMapProps = {
  current: TrackingPoint | null;
  history: TrackingPoint[];
  predictions: TrackingPoint[];
  adjacentNodes: AdjacentNode[];
};

const defaultCenter: [number, number] = [23.75, 90.37];

export default function StolenTrackingMap({
  current,
  history,
  predictions,
  adjacentNodes,
}: TrackingMapProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (current) return [current.latitude, current.longitude];
    if (predictions.length > 0) return [predictions[0].latitude, predictions[0].longitude];
    return defaultCenter;
  }, [current, predictions]);

  const historyPath = useMemo<[number, number][]>(() => {
    return history.map((p) => [p.latitude, p.longitude]);
  }, [history]);

  const predictedPath = useMemo<[number, number][]>(() => {
    const points: [number, number][] = [];
    if (current) {
      points.push([current.latitude, current.longitude]);
    }
    predictions.forEach((p) => points.push([p.latitude, p.longitude]));
    return points;
  }, [current, predictions]);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    const map = L.map(mapNodeRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(center, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (current) {
      L.circleMarker([current.latitude, current.longitude], {
        radius: 8,
        color: "#ef4444",
        weight: 2,
        fillColor: "#ef4444",
        fillOpacity: 0.8,
      })
        .bindPopup(current.location_name || "Last known position")
        .addTo(layerGroup);
    }

    history.forEach((point, idx) => {
      L.circleMarker([point.latitude, point.longitude], {
        radius: 4,
        color: "#22d3ee",
        weight: 1,
        fillColor: "#22d3ee",
        fillOpacity: 0.55,
      })
        .bindPopup(
          `${point.location_name || "History point"}${point.timestamp ? ` at ${new Date(point.timestamp).toLocaleString()}` : ""}`
        )
        .addTo(layerGroup);
    });

    predictions.forEach((point) => {
      L.circleMarker([point.latitude, point.longitude], {
        radius: 6,
        color: "#3b82f6",
        weight: 1,
        fillColor: "#3b82f6",
        fillOpacity: 0.65,
      })
        .bindPopup(
          `Predicted #${point.step || "-"}${point.eta ? ` at ${new Date(point.eta).toLocaleTimeString()}` : ""}`
        )
        .addTo(layerGroup);
    });

    adjacentNodes.forEach((node) => {
      L.circleMarker([node.latitude, node.longitude], {
        radius: 7,
        color: "#f59e0b",
        weight: 2,
        fillColor: "#f59e0b",
        fillOpacity: 0.6,
      })
        .bindPopup(
          `Possible next node: ${node.location_name} (${node.distance_km.toFixed(2)} km)`
        )
        .addTo(layerGroup);
    });

    const historyPath: [number, number][] = history.map((p) => [p.latitude, p.longitude]);
    const predictedPath: [number, number][] = [];
    if (current) predictedPath.push([current.latitude, current.longitude]);
    predictions.forEach((p) => predictedPath.push([p.latitude, p.longitude]));

    if (historyPath.length > 1) {
      L.polyline(historyPath, { color: "#22c55e", weight: 4, opacity: 0.85 }).addTo(layerGroup);
      L.polyline(historyPath, { color: "#14b8a6", weight: 2, opacity: 0.35 }).addTo(layerGroup);
    }

    if (predictedPath.length > 1) {
      L.polyline(predictedPath, { color: "#3b82f6", weight: 3, opacity: 0.8 }).addTo(layerGroup);
    }

    if (current) {
      adjacentNodes.forEach((node) => {
        L.polyline(
          [
            [current.latitude, current.longitude],
            [node.latitude, node.longitude],
          ],
          { color: "#f59e0b", weight: 2, opacity: 0.55 }
        ).addTo(layerGroup);
      });
    }

    const boundsPoints = [
      ...historyPath,
      ...predictedPath,
      ...adjacentNodes.map((node) => [node.latitude, node.longitude] as [number, number]),
      ...(current ? ([[current.latitude, current.longitude]] as [number, number][]) : []),
    ];

    if (boundsPoints.length > 0) {
      map.fitBounds(L.latLngBounds(boundsPoints), { padding: [30, 30], maxZoom: 15 });
    } else {
      map.setView(center, 13);
    }
  }, [current, history, predictions, adjacentNodes, center]);

  return (
    <div style={{ height: "260px", width: "100%", borderRadius: "14px", overflow: "hidden" }}>
      <div ref={mapNodeRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
