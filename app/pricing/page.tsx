"use client";

import React from "react"

import {
  Check,
  X,
  Crown,
  Building2,
  Sparkles,
  Globe,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { PLAN_FEATURES, type PlanTier } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

const features = [
  { name: "News Archive", free: "24 hours", premium: "12 months", business: "5 years" },
  { name: "Categories", free: "3 max", premium: "Unlimited", business: "Unlimited" },
  { name: "Ad-free Experience", free: false, premium: true, business: true },
  { name: "Export (PDF/Data)", free: false, premium: true, business: true },
  { name: "Analytics & Trends", free: false, premium: true, business: true },
  { name: "Push Alerts", free: false, premium: true, business: true },
  { name: "Personalized Feeds", free: false, premium: true, business: true },
  { name: "API Access", free: false, premium: false, business: true },
  { name: "White-label Option", free: false, premium: false, business: true },
  { name: "Team Accounts", free: "1", premium: "1", business: "Up to 10" },
  { name: "Priority Support", free: false, premium: true, business: true },
  { name: "Custom Integrations", free: false, premium: false, business: true },
];

const plans: { key: PlanTier; icon: React.ReactNode; popular?: boolean }[] = [
  { key: "free", icon: <Globe className="w-6 h-6" /> },
  { key: "premium", icon: <Crown className="w-6 h-6" />, popular: true },
  { key: "business", icon: <Building2 className="w-6 h-6" /> },
];

export default function PricingPage() {
  const { user, setPlan, login } = useAppStore();

  const handleSelectPlan = (plan: PlanTier) => {
    if (!user.isLoggedIn) {
      login();
    }
    setPlan(plan);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to App</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">GlobeNews</span>
          </Link>
          <div className="w-24" />
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Pricing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Choose the plan that fits your needs
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From individual news enthusiasts to enterprise teams, we have a plan for everyone.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map(({ key, icon, popular }) => {
              const plan = PLAN_FEATURES[key];
              const isCurrentPlan = user.plan === key;

              return (
                <div
                  key={key}
                  className={cn(
                    "relative p-6 rounded-2xl border transition-all",
                    popular
                      ? "border-primary bg-primary/5 scale-105"
                      : "border-border/50 bg-card/50",
                    isCurrentPlan && "ring-2 ring-primary"
                  )}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      Most Popular
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                      Current Plan
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        popular ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold capitalize">{plan.name}</h3>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      {plan.price === 0 ? "Free" : `€${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>

                  <Button
                    className={cn(
                      "w-full mb-6",
                      popular && "bg-primary hover:bg-primary/90"
                    )}
                    variant={popular ? "default" : "outline"}
                    disabled={isCurrentPlan}
                    onClick={() => handleSelectPlan(key)}
                  >
                    {isCurrentPlan
                      ? "Current Plan"
                      : key === "free"
                        ? "Get Started"
                        : `Upgrade to ${plan.name}`}
                  </Button>

                  <ul className="space-y-3">
                    {features.slice(0, 6).map((feature) => {
                      const value = feature[key];
                      const hasFeature = value !== false;

                      return (
                        <li
                          key={feature.name}
                          className="flex items-center gap-2 text-sm"
                        >
                          {hasFeature ? (
                            <Check className="w-4 h-4 text-accent shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <span
                            className={cn(
                              !hasFeature && "text-muted-foreground"
                            )}
                          >
                            {feature.name}
                            {typeof value === "string" && (
                              <span className="text-muted-foreground ml-1">
                                ({value})
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Complete Feature Comparison
          </h2>

          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 font-medium">Free</th>
                  <th className="text-center py-4 px-4 font-medium text-primary">
                    Premium
                  </th>
                  <th className="text-center py-4 px-4 font-medium">Business</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr key={feature.name} className="border-b border-border/50">
                    <td className="py-4 px-4 text-sm">{feature.name}</td>
                    {(["free", "premium", "business"] as const).map((plan) => {
                      const value = feature[plan];
                      return (
                        <td key={plan} className="text-center py-4 px-4">
                          {typeof value === "boolean" ? (
                            value ? (
                              <Check className="w-5 h-5 text-accent mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground mx-auto" />
                            )
                          ) : (
                            <span className="text-sm">{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Educational Licensing */}
      <section className="py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center glass rounded-2xl p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Educational Licensing</h2>
            <p className="text-muted-foreground mb-6">
              Special pricing available for schools, universities, and educational
              institutions. Get access to GlobeNews for your students and faculty
              at a discounted rate.
            </p>
            <Button variant="outline" size="lg">
              Contact Us for Educational Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Demo Mode Switcher */}
      <section className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Demo Mode: Switch plans to test features
            </p>
            <div className="flex justify-center gap-2">
              {(["free", "premium", "business"] as const).map((plan) => (
                <Button
                  key={plan}
                  variant={user.plan === plan ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (!user.isLoggedIn) login();
                    setPlan(plan);
                  }}
                  className="capitalize"
                >
                  {plan}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
