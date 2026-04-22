"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAppStore } from "@/lib/store";
import type { NewsItem } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";
import { X, ExternalLink, Bookmark, Share2 } from "lucide-react";

function formatTimeAgo(timestamp: Date | string): string {
  const now = new Date();
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function MapboxGlobe() {
  const filteredNews = useAppStore((state) => state.filteredNews);
  const setSelectedNews = useAppStore((state) => state.setSelectedNews);
  const storeNews = useAppStore((state) => state.news);
  const filters = useAppStore((state) => state.filters);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);

  // Fetch Mapbox token from API
  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/mapbox-token");
        const data = await res.json();
        if (data.error) {
          setTokenError(data.error);
        } else {
          setMapboxToken(data.token);
        }
      } catch {
        setTokenError("Failed to load map");
      }
    }
    fetchToken();
  }, []);

  // Get filtered news — useMemo ensures stable reference, only recomputes when news/filters change
  const news = useMemo(() => {
    try {
      const result = filteredNews();
      return Array.isArray(result)
        ? result.filter(
            (item) =>
              item &&
              typeof item.lat === "number" &&
              typeof item.lng === "number" &&
              !Number.isNaN(item.lat) &&
              !Number.isNaN(item.lng)
          )
        : [];
    } catch {
      return [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeNews, filters]);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [0, 20],
      zoom: 1.5,
      projection: "globe",
    });

    map.current.on("style.load", () => {
      if (!map.current) return;
      
      // Add fog/atmosphere effect for realistic Earth look
      map.current.setFog({
        color: "rgb(186, 210, 235)",
        "high-color": "rgb(36, 92, 223)",
        "horizon-blend": 0.02,
        "space-color": "rgb(11, 11, 25)",
        "star-intensity": 0.6,
      });

      setMapLoaded(true);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    return () => {
      setMapLoaded(false);
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Update markers when news changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    news.forEach((item) => {
      const color = item.sponsored
        ? CATEGORY_COLORS.Sponsored
        : CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Politics;
      const isBreaking = item.importance === "Breaking";

      // Create marker element
      const el = document.createElement("div");
      el.className = "news-marker";
      el.style.cssText = `
        width: ${isBreaking ? 18 : 14}px;
        height: ${isBreaking ? 18 : 14}px;
        background-color: ${color};
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.8);
        box-shadow: 0 0 ${isBreaking ? 12 : 8}px ${color};
        cursor: pointer;
        transition: box-shadow 0.2s ease;
      `;

      el.addEventListener("mouseenter", () => {
        el.style.boxShadow = `0 0 20px ${color}, 0 0 30px ${color}`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.boxShadow = `0 0 ${isBreaking ? 12 : 8}px ${color}`;
      });

      el.addEventListener("click", () => {
        setSelectedItem(item);
        setSelectedNews(item);

        // Close existing popup
        if (popupRef.current) {
          popupRef.current.remove();
        }

        // Create popup content
        const popupContent = document.createElement("div");
        popupContent.innerHTML = `
          <div style="background: var(--card); border-radius: 12px; overflow: hidden; min-width: 280px; max-width: 320px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
            ${item.imageUrl ? `
              <div style="position: relative; height: 120px; overflow: hidden;">
                <img src="${item.imageUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
                <div style="position: absolute; inset: 0; background: linear-gradient(to top, var(--card), transparent);"></div>
              </div>
            ` : ""}
            <div style="padding: 12px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></span>
                <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: ${color};">
                  ${item.sponsored ? "Sponsored" : item.category}
                </span>
                ${isBreaking ? '<span style="font-size: 10px; font-weight: bold; color: #f87171; background: rgba(248,113,113,0.2); padding: 2px 6px; border-radius: 4px;">BREAKING</span>' : ""}
                <span style="font-size: 11px; color: var(--muted-foreground); margin-left: auto;">${formatTimeAgo(item.timestamp)}</span>
              </div>
              <h3 style="font-weight: 600; font-size: 14px; color: var(--foreground); line-height: 1.4; margin-bottom: 8px;">${item.title}</h3>
              <p style="font-size: 12px; color: var(--muted-foreground); line-height: 1.5; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.description || ""}</p>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 11px; color: var(--muted-foreground);">${item.source}</span>
              </div>
            </div>
          </div>
        `;

        // Create and show popup
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "340px",
          offset: 15,
        })
          .setLngLat([item.lng, item.lat])
          .setDOMContent(popupContent)
          .addTo(map.current!);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([item.lng, item.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [news, mapLoaded, setSelectedNews]);

  // Loading / Error states
  if (tokenError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <p className="text-destructive mb-2">{tokenError}</p>
          <p className="text-sm text-muted-foreground">
            Please add MAPBOX_TOKEN to environment variables
          </p>
        </div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Mapbox custom styles */}
      <style jsx global>{`
        .mapboxgl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 12px !important;
        }
        .mapboxgl-popup-close-button {
          font-size: 20px;
          padding: 4px 8px;
          color: var(--foreground);
          right: 4px;
          top: 4px;
        }
        .mapboxgl-popup-tip {
          display: none;
        }
        .mapboxgl-ctrl-group {
          background: rgba(15, 15, 25, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px);
        }
        .mapboxgl-ctrl-group button {
          background: transparent !important;
        }
        .mapboxgl-ctrl-group button + button {
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .mapboxgl-ctrl-icon {
          filter: invert(1);
        }
      `}</style>
    </div>
  );
}
