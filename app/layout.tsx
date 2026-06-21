import "./globals.css";
import React from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import LiveTicker from "@/components/layout/LiveTicker";

export const metadata: Metadata = {
  title: "Arthenix — The Universe of Human Knowledge",
  description:
    "12 knowledge worlds. Gaming, AI, Psychology, Anime, Science, Tech and more. Learn, explore, and trade on Arthenix.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-primary-bg text-text-primary font-body antialiased">
        <Navbar />
        <LiveTicker />
        <main>{children}</main>
      </body>
    </html>
  );
}