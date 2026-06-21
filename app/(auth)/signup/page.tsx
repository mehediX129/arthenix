import React from "react";
import type { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up — Arthenix",
  description: "Create your Arthenix account and start exploring.",
};

export default function SignupPage() {
  return <SignupForm />;
}