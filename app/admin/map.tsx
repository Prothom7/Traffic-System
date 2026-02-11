"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationMarker {
  name: string;
  latitude: number;
  longitude: number;
}

interface MapProps {
  markers?: LocationMarker[];
}

const Map: React.FC<MapProps> = ({ markers = [] }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const defaultPosition: [number, number] = [23.75, 90.37];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeMap = () => {
      const container = document.getElementById("map-container");
      if (!container || mapRef.current) return;

      // Create map instance
      const map = L.map("map-container").setView(defaultPosition, 15);
      mapRef.current = map;

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // Add current location marker
      let currentMarker: L.Marker | null = null;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const pos_coords: [number, number] = [
              pos.coords.latitude,
              pos.coords.longitude,
            ];
            map.setView(pos_coords);
            if (currentMarker) {
              currentMarker.setLatLng(pos_coords);
            } else {
              currentMarker = L.marker(pos_coords).addTo(map);
              currentMarker.bindPopup("Your Current Location");
            }
          },
          () => {
            currentMarker = L.marker(defaultPosition).addTo(map);
            currentMarker.bindPopup("Your Current Location");
          }
        );
      } else {
        currentMarker = L.marker(defaultPosition).addTo(map);
        currentMarker.bindPopup("Your Current Location");
      }

      // Add location markers from database
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      markers.forEach((location) => {
        const position: [number, number] = [location.latitude, location.longitude];
        const marker = L.marker(position).addTo(map);
        marker.bindPopup(`📍 ${location.name}`);
        markersRef.current.push(marker);
      });
    };

    // Delay to ensure DOM is ready
    const timer = setTimeout(initializeMap, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    console.log("Updating map with markers:", markers);
    console.log("Number of markers to add:", markers.length);

    // Update markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (markers.length === 0) {
      console.log("No markers to display");
      return;
    }

    markers.forEach((location) => {
      const position: [number, number] = [location.latitude, location.longitude];
      console.log(`Adding marker at [${position[0]}, ${position[1]}] for ${location.name}`);
      const marker = L.marker(position).addTo(mapRef.current!);
      marker.bindPopup(`📍 ${location.name}`);
      markersRef.current.push(marker);
    });

    // Fit map bounds to show all markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }, [markers]);

  return (
    <div
      id="map-container"
      style={{
        height: "500px",
        width: "100%",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    />
  );
};

export default Map;
