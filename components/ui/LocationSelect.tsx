"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { countries } from "@/lib/data/countries";

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LocationSelect({ value, onChange }: LocationSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const updateCoords = useCallback(() => {
    if (!inputWrapperRef.current) return;
    const rect = inputWrapperRef.current.getBoundingClientRect();
    // position: fixed viewport-relative, তাই scrollY/scrollX যোগ করা লাগবে না
    setCoords({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateCoords();
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !document.getElementById("location-select-dropdown")?.contains(target)
      ) {
        setOpen(false);
        setSearch(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filtered = countries
    .filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  function handleSelect(country: string) {
    onChange(country);
    setSearch(country);
    setOpen(false);
  }

  const dropdown =
    mounted && open && filtered.length > 0
      ? createPortal(
          <div
            id="location-select-dropdown"
            className="fixed rounded-xl overflow-hidden max-h-56 overflow-y-auto"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 9999,
              background: "rgba(18,18,31,0.98)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(124,58,237,0.25)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            {filtered.map((country) => (
              <button
                key={country}
                type="button"
                onClick={() => handleSelect(country)}
                className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-left"
              >
                {country}
                {value === country && <Check size={13} className="text-violet-400" />}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef} className="relative">
      <div ref={inputWrapperRef} className="relative">
        <MapPin
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search your country..."
          className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-9 py-2.5 text-text-primary placeholder:text-text-muted outline-none focus:border-violet-500/50 transition-colors"
        />
        <ChevronDown
          size={15}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {dropdown}
    </div>
  );
}