"use client";

import { X, Sparkles, Check, Crown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { PLAN_FEATURES } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

const featureMessages: Record<string, { title: string; description: string }> = {
  categories: {
    title: "Unlock More Categories",
    description:
      "Free users can only track 3 categories. Upgrade to Premium for unlimited category tracking.",
  },
  archive: {
    title: "Access Historical Archives",
    description:
      "Free users can only view news from the last 24 hours. Upgrade to access up to 12 months of archives.",
  },
  savedTopics: {
    title: "Personalized Feed",
    description:
      "Save your favorite topics and create personalized news feeds with Premium.",
  },
  exports: {
    title: "Export Your Data",
    description:
      "Download news data as PDF or CSV files with Premium or Business plans.",
  },
  analytics: {
    title: "Analytics & Trends",
    description:
      "Access detailed analytics and trend analysis with Premium or Business plans.",
  },
  alerts: {
    title: "Push Alerts",
    description:
      "Get notified about breaking news in your selected categories with Premium.",
  },
  api: {
    title: "API Access",
    description:
      "Integrate GlobeNews data into your applications with our Business API.",
  },
  embed: {
    title: "Embed Widget",
    description:
      "Embed a live news widget on your website with Business plan.",
  },
  team: {
    title: "Team Accounts",
    description:
      "Share access with your team members with Business plan (up to 10 users).",
  },
};

export default function PaywallModal() {
  const { showPaywall, paywallFeature, closePaywall, setPlan, login, user } =
    useAppStore();

  if (!showPaywall) return null;

  const message = featureMessages[paywallFeature] || {
    title: "Premium Feature",
    description: "This feature requires a Premium or Business subscription.",
  };

  const handleSelectPlan = (plan: "premium" | "business") => {
    if (!user.isLoggedIn) {
      login();
    }
    setPlan(plan);
    closePaywall();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={closePaywall}
      />

      {/* Modal */}
      <div className="relative glass rounded-2xl overflow-hidden max-w-2xl w-full animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10"
          onClick={closePaywall}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Header */}
        <div className="p-6 text-center border-b border-border/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{message.title}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {message.description}
          </p>
        </div>

        {/* Plans */}
        <div className="p-6 grid md:grid-cols-2 gap-4">
          {/* Premium */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Premium</h3>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold">
                €{PLAN_FEATURES.premium.price}
              </span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                No ads
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                12 months archive
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                Unlimited categories
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                Export & Analytics
              </li>
            </ul>
            <Button
              className="w-full"
              onClick={() => handleSelectPlan("premium")}
            >
              Get Premium
            </Button>
          </div>

          {/* Business */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Business</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                Best Value
              </span>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold">
                €{PLAN_FEATURES.business.price}
              </span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                Everything in Premium
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                5 years archive
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                API access
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                Team accounts (10)
              </li>
            </ul>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => handleSelectPlan("business")}
            >
              Get Business
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            onClick={closePaywall}
          >
            Compare all plans →
          </Link>
        </div>
      </div>
    </div>
  );
}
