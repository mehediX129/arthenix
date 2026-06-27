import React from "react";
import HeroSection from "@/components/home/HeroSection";
import WorldsGrid from "@/components/home/WorldsGrid";
import TrendingSection from "@/components/home/TrendingSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import HomeCTA from "@/components/home/HomeCTA";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-primary-bg">
      <HeroSection />
      <WorldsGrid />
      <TrendingSection />
      <FeaturedProducts />
      <HomeCTA />
    </main>
  );
}