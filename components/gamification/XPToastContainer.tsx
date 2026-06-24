"use client";

import { AnimatePresence } from "framer-motion";
import { XPToast } from "./XPToast";
import { useXPToastStore } from "@/store/xpToastStore";

export function XPToastContainer() {
  const { toasts, removeToast } = useXPToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <XPToast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}