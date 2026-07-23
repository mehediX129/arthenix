import React from "react";
import HeroSection from "@/components/home/HeroSection";
import TrendingSection from "@/components/home/TrendingSection";
import WorldsGrid from "@/components/home/WorldsGrid";
import HomeCTA from "@/components/home/HomeCTA";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-primary-bg">
      <HeroSection />
      {/* Real, trending content shown right after the hero — visitors see
          actual articles immediately instead of just marketing copy. */}
      <TrendingSection />
      <WorldsGrid />
      <HomeCTA />
    </main>
  );
}