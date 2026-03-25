"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import TopNav from "@/components/layout/top-nav";
import FilterSidebar from "@/components/layout/filter-sidebar";
import TimelineSlider from "@/components/layout/timeline-slider";
import NewsPopup from "@/components/news/news-popup";
import PaywallModal from "@/components/paywall/paywall-modal";
import FeedView from "@/components/news/feed-view";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Dynamically import the Mapbox globe to avoid SSR issues
const MapboxGlobe = dynamic(() => import("@/components/globe/mapbox-globe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading globe...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const { view, theme, fetchNews, newsLoading } = useAppStore();

  // Fetch news on mount
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    if (theme === "light") {
      document.documentElement.classList.add("light");
    }
  }, [theme]);

  return (
    <div
      className={cn(
        "min-h-screen bg-background transition-colors",
        theme === "light" && "light"
      )}
    >
      {/* Space background */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              theme === "dark"
                ? "radial-gradient(ellipse at center, #0f0f1a 0%, #050510 100%)"
                : "radial-gradient(ellipse at center, #f8fafc 0%, #e2e8f0 100%)",
          }}
        />
        {/* Stars effect for dark mode */}
        {theme === "dark" && (
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: `radial-gradient(2px 2px at 20px 30px, white, transparent),
                radial-gradient(2px 2px at 40px 70px, white, transparent),
                radial-gradient(1px 1px at 90px 40px, white, transparent),
                radial-gradient(2px 2px at 160px 120px, white, transparent),
                radial-gradient(1px 1px at 230px 80px, white, transparent),
                radial-gradient(2px 2px at 300px 150px, white, transparent),
                radial-gradient(1px 1px at 350px 30px, white, transparent),
                radial-gradient(2px 2px at 400px 100px, white, transparent)`,
              backgroundRepeat: "repeat",
              backgroundSize: "500px 200px",
            }}
          />
        )}
      </div>

      {/* Navigation */}
      <TopNav />

      {/* Sidebar */}
      <FilterSidebar />

      {/* Main Content */}
      <main className="pt-16 pl-72 pb-24 min-h-screen">
        {view === "globe" ? (
          <div className="h-[calc(100vh-10rem)]">
            <MapboxGlobe />
          </div>
        ) : (
          <div className="h-[calc(100vh-10rem)]">
            <FeedView />
          </div>
        )}
      </main>

      {/* Timeline */}
      <TimelineSlider />

      {/* Modals */}
      <NewsPopup />
      <PaywallModal />
    </div>
  );
}
