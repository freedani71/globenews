"use client";

/**
 * @file mapbox-globe.tsx
 * @fileoverview 3D-Globus-Komponente der GlobeNews-Applikation auf Basis von Mapbox GL JS.
 *              Rendert Nachrichtenartikel als interaktive Marker auf einem Satelliten-Globus
 *              und gruppiert räumlich nahe Artikel zu Cluster-Markern.
 * @author Projektteam GlobeNews
 * @version 1.0
 * @date 2026-05-20
 */

import { useRef, useState, useEffect, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAppStore } from "@/lib/store";
import type { NewsItem } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";

/**
 * Sortierreihenfolge der Wichtigkeitsstufen.
 * Breaking (0) erscheint vor Top (1) und General (2).
 */
const IMPORTANCE_ORDER: Record<string, number> = { Breaking: 0, Top: 1, General: 2 };

/**
 * Gibt die vergangene Zeit seit einem Zeitstempel als kompakte Zeichenkette zurück.
 * @param ts - Datum als Date-Objekt oder ISO-String
 * @returns Formatierter Zeitabstand, z.B. "5m", "2h" oder "3d"
 */
function timeAgo(ts: Date | string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

/**
 * Interaktiver 3D-Globus-Viewer mit Nachrichtenmarkern.
 *
 * Architektur der Marker-DOM-Struktur:
 * - Äusseres Element (`el`): wird von Mapbox GL für die Projektionstransformation
 *   (lat/lng → Bildschirmkoordinaten) vollständig kontrolliert. Dieses Element
 *   darf **nicht** animiert werden, da Mapbox dessen `transform`-Style überschreibt.
 * - Inneres Element (`dot`): liegt sicher innerhalb des Mapbox-Containers und kann
 *   beliebig animiert werden (Hover-Scale, Pulse-Ring usw.).
 *
 * Cluster-Logik:
 * - Artikel werden nach auf eine Dezimalstelle gerundeten Koordinaten gruppiert.
 * - Eine Dezimalstelle entspricht ca. 11 km Genauigkeit, was urbane Gebiete
 *   sinnvoll zusammenfasst, ohne entfernte Städte zu vermischen.
 *
 * Pulse-Ring-Animation:
 * - Breaking-Einzelmarker erhalten ein absolut positioniertes Pseudo-Element,
 *   das per CSS-Keyframe-Animation (`pulse-ring`) nach aussen schwingt und ausbleidet.
 *   Der Ring ist `pointer-events: none`, damit er keine Klick-Events abfängt.
 */
export default function MapboxGlobe() {
  const filteredNews = useAppStore((state) => state.filteredNews);
  const setSelectedNews = useAppStore((state) => state.setSelectedNews);
  const storeNews = useAppStore((state) => state.news);
  const filters = useAppStore((state) => state.filters);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const user = useAppStore((state) => state.user);
  const theme = useAppStore((state) => state.theme);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/mapbox-token");
        const data = await res.json();
        if (data.error) setTokenError(data.error);
        else setMapboxToken(data.token);
      } catch {
        setTokenError("Failed to load map");
      }
    }
    fetchToken();
  }, []);

  // filteredNews() ist eine Funktion im Store — useMemo abonniert die relevanten
  // State-Felder explizit, damit React-Memoization korrekt funktioniert.
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
  }, [storeNews, filters, searchQuery, user, theme]);

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
      map.current.setFog({
        color: "rgb(186, 210, 235)",
        "high-color": "rgb(36, 92, 223)",
        "horizon-blend": 0.02,
        "space-color": "rgb(11, 11, 25)",
        "star-intensity": 0.6,
      });
      setMapLoaded(true);
    });

    map.current.on("click", () => {
      popupRef.current?.remove();
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    return () => {
      setMapLoaded(false);
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Build markers — cluster items at same location
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    popupRef.current?.remove();

    // Koordinaten auf eine Dezimalstelle runden → Cluster-Schlüssel.
    // 0.1° ≈ 11 km: nahe genug um städtische Häufungen zu bündeln,
    // weit genug um benachbarte Grossstädte getrennt zu halten.
    const groups = new Map<string, NewsItem[]>();
    news.forEach((item) => {
      const key = `${item.lat.toFixed(1)},${item.lng.toFixed(1)}`;
      const g = groups.get(key) ?? [];
      g.push(item);
      groups.set(key, g);
    });

    groups.forEach((items) => {
      // Sort Breaking → Top → General, newest first within tier
      const sorted = [...items].sort((a, b) => {
        const diff = IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance];
        if (diff !== 0) return diff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      const top = sorted[0];
      const isCluster = sorted.length > 1;
      const color = CATEGORY_COLORS[top.category] || CATEGORY_COLORS.Politics;
      const isBreaking = top.importance === "Breaking";
      const isTop = top.importance === "Top";
      const size = isCluster
        ? Math.min(26 + sorted.length * 1.5, 38)
        : isBreaking ? 20 : isTop ? 15 : 11;
      const glowSize = isBreaking ? 14 : isTop ? 8 : 5;

      // Äusserer Container: Mapbox GL schreibt hier den Positions-Transform.
      // Keine CSS-Animationen oder transform-Änderungen auf diesem Element —
      // sie würden von Mapbox bei jedem Frame überschrieben.
      const el = document.createElement("div");
      el.style.cssText = `width:${size}px;height:${size}px;cursor:pointer;`;

      // Inner: safe to animate
      const dot = document.createElement("div");
      dot.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
        background-color: ${color};
        border-radius: 50%;
        border: ${isCluster || isBreaking ? "2px" : "1.5px"} solid rgba(255,255,255,${isBreaking || isCluster ? 0.9 : 0.6});
        box-shadow: 0 0 ${glowSize}px ${color}cc;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      el.appendChild(dot);

      // Cluster count badge
      if (isCluster) {
        const badge = document.createElement("span");
        badge.style.cssText = `
          color: #fff;
          font-size: ${sorted.length > 9 ? "9" : "10"}px;
          font-weight: 800;
          line-height: 1;
          pointer-events: none;
        `;
        badge.textContent = String(sorted.length);
        dot.appendChild(badge);
      }

      // Pulse ring for breaking single markers
      if (isBreaking && !isCluster) {
        const pulse = document.createElement("div");
        pulse.style.cssText = `
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 1.5px solid ${color}88;
          animation: pulse-ring 1.8s ease-out infinite;
          pointer-events: none;
        `;
        dot.appendChild(pulse);
      }

      el.addEventListener("mouseenter", () => {
        dot.style.transform = "scale(1.4)";
        dot.style.boxShadow = `0 0 ${glowSize * 2}px ${color}, 0 0 ${glowSize * 3}px ${color}55`;
      });
      el.addEventListener("mouseleave", () => {
        dot.style.transform = "scale(1)";
        dot.style.boxShadow = `0 0 ${glowSize}px ${color}cc`;
      });

      if (isCluster) {
        // Cluster click → popup with scrollable article list
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          popupRef.current?.remove();

          map.current?.flyTo({
            center: [top.lng, top.lat],
            zoom: Math.max(map.current.getZoom(), 3),
            speed: 1.4,
            curve: 1.2,
          });

          // Farben werden vorab aufgelöst: CSS-Variablen (z.B. hsl(var(--card))) sind
          // im Mapbox-Popup-DOM nicht verfügbar, da es ausserhalb des Next.js-Render-Baums sitzt.
          const isDark = theme === "dark";
          const bg       = isDark ? "#1c1c2e" : "#ffffff";
          const fg       = isDark ? "#f0f0f0" : "#1a1a1a";
          const muted    = isDark ? "#888"    : "#666";
          const divider  = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
          const hoverBg  = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

          const container = document.createElement("div");
          container.style.cssText = `
            background: ${bg};
            border-radius: 10px;
            overflow: hidden;
            width: 280px;
          `;

          // Header
          const header = document.createElement("div");
          header.style.cssText = `
            padding: 9px 12px;
            font-size: 10px;
            font-weight: 700;
            color: ${muted};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid ${divider};
          `;
          header.textContent = `${sorted.length} Artikel an diesem Ort`;
          container.appendChild(header);

          // Scrollable list (max 15 shown)
          const MAX_SHOWN = 15;
          const shown = sorted.slice(0, MAX_SHOWN);
          const list = document.createElement("div");
          list.style.cssText = `max-height: 320px; overflow-y: auto;`;
          container.appendChild(list);

          shown.forEach((item, i) => {
            const itemColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Politics;
            const row = document.createElement("div");
            row.style.cssText = `
              display: flex;
              align-items: flex-start;
              gap: 8px;
              padding: 8px 12px;
              cursor: pointer;
              border-bottom: ${i < sorted.length - 1 ? `1px solid ${divider}` : "none"};
              transition: background 0.12s;
            `;

            const pip = document.createElement("div");
            pip.style.cssText = `
              width: 6px; height: 6px;
              border-radius: 50%;
              background: ${itemColor};
              margin-top: 4px;
              flex-shrink: 0;
            `;

            const body = document.createElement("div");
            body.style.cssText = `flex: 1; min-width: 0;`;

            const title = document.createElement("p");
            title.style.cssText = `
              font-size: 12px;
              font-weight: 600;
              color: ${fg};
              line-height: 1.35;
              margin: 0 0 2px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            `;
            title.textContent = item.title;

            const meta = document.createElement("span");
            meta.style.cssText = `font-size: 10px; color: ${muted};`;
            meta.textContent = `${item.source} · ${timeAgo(item.timestamp)}`;

            body.appendChild(title);
            body.appendChild(meta);
            row.appendChild(pip);
            row.appendChild(body);

            row.addEventListener("mouseenter", () => { row.style.background = hoverBg; });
            row.addEventListener("mouseleave", () => { row.style.background = "transparent"; });
            row.addEventListener("click", (ev) => {
              ev.stopPropagation();
              popupRef.current?.remove();
              setSelectedNews(item);
            });

            list.appendChild(row);
          });

          // "X weitere" footer if truncated
          if (sorted.length > MAX_SHOWN) {
            const more = document.createElement("div");
            more.style.cssText = `
              padding: 7px 12px;
              font-size: 10px;
              color: ${muted};
              border-top: 1px solid ${divider};
              text-align: center;
            `;
            more.textContent = `+ ${sorted.length - MAX_SHOWN} weitere Artikel`;
            container.appendChild(more);
          }

          popupRef.current = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: "300px",
            offset: 15,
          })
            .setLngLat([top.lng, top.lat])
            .setDOMContent(container)
            .addTo(map.current!);
        });
      } else {
        // Single marker click → open article directly
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          map.current?.flyTo({
            center: [top.lng, top.lat],
            zoom: Math.max(map.current.getZoom(), 3),
            speed: 1.4,
            curve: 1.2,
          });
          setSelectedNews(top);
        });
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([top.lng, top.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [news, mapLoaded, setSelectedNews]);

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

      {mapLoaded && news.length > 0 && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-sm text-white border border-white/10 pointer-events-none">
          {news.length} Artikel
        </div>
      )}

      <style jsx global>{`
        .mapboxgl-popup-content {
          padding: 0 !important;
          background: hsl(var(--card)) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
          border-radius: 10px !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
        }
        .mapboxgl-popup-close-button {
          color: #888;
          font-size: 18px;
          padding: 4px 8px;
          line-height: 1;
        }
        .mapboxgl-popup-close-button:hover { color: #fff; }
        .mapboxgl-popup-tip { display: none; }
        .mapboxgl-ctrl-group {
          background: rgba(15,15,25,0.8) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          backdrop-filter: blur(10px);
        }
        .mapboxgl-ctrl-group button { background: transparent !important; }
        .mapboxgl-ctrl-group button + button {
          border-top: 1px solid rgba(255,255,255,0.1) !important;
        }
        .mapboxgl-ctrl-icon { filter: invert(1); }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          80%  { transform: scale(2.2); opacity: 0;   }
          100% { transform: scale(2.2); opacity: 0;   }
        }
      `}</style>
    </div>
  );
}
