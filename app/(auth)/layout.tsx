import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-primary-bg px-4 py-12">
      {/* Ambient gradient glow — top-left violet, bottom-right cyan */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full opacity-30 blur-[120px]"
        style={{ background: "#7C3AED" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "#06B6D4" }}
      />

      {/* Subtle grid texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#F8FAFC 1px, transparent 1px), linear-gradient(90deg, #F8FAFC 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}