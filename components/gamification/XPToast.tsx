"use client";

import { useEffect, forwardRef } from "react";
import { motion } from "framer-motion";

export interface XPToastData {
  id: string;
  xp: number;
  reason: string;
  icon?: string;
}

interface XPToastProps {
  toast: XPToastData;
  onRemove: (id: string) => void;
}

export const XPToast = forwardRef<HTMLDivElement, XPToastProps>(
  function XPToast({ toast, onRemove }, ref) {
    useEffect(() => {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, 3500);
      return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0f0f0f] border border-white/10 shadow-2xl backdrop-blur-md min-w-[220px] max-w-[300px]"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-yellow-400/10 text-yellow-400 text-lg shrink-0">
          {toast.icon ?? "⚡"}
        </div>
        <div className="flex flex-col">
          <span className="text-yellow-400 font-bold text-sm leading-tight">
            +{toast.xp} XP
          </span>
          <span className="text-white/60 text-xs leading-tight mt-0.5">
            {toast.reason}
          </span>
        </div>
      </motion.div>
    );
  }
);