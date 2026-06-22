"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import TopNav from "@/components/layout/top-nav";
import FilterSidebar from "@/components/layout/filter-sidebar";
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
  const { view, theme, fetchNews } = useAppStore();

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
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-background" />

      {/* Navigation */}
      <TopNav />

      {/* Sidebar */}
      <FilterSidebar />

      {/* Main Content */}
      <main className="pt-14 pl-64 min-h-screen">
        {view === "globe" ? (
          <div className="h-[calc(100vh-3.5rem)]">
            <MapboxGlobe />
          </div>
        ) : (
          <div className="h-[calc(100vh-3.5rem)]">
            <FeedView />
          </div>
        )}
      </main>

      {/* Modals */}
      <NewsPopup />
      <PaywallModal />
    </div>
  );
}
