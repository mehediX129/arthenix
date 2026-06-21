import React from "react";
import HeroSection from "@/components/home/HeroSection";
import WorldsGrid from "@/components/home/WorldsGrid";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-primary-bg">
      <HeroSection />
      <WorldsGrid />
    </main>
  );
}