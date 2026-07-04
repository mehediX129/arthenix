"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getProfileByUsername } from "@/lib/db/profiles";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import type { Profile } from "@/types/database";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: userLoading, isLoggedIn } = useUser();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // middleware.ts ইতিমধ্যে /profile route protect করে, কিন্তু client-side
    // এখনো loading অবস্থায় থাকতে পারে — তাই এখানে extra guard রাখা হলো
    if (!userLoading && !isLoggedIn) {
      router.push("/login?redirect=/profile/edit");
      return;
    }

    if (!user) return;

    async function load() {
      const result = await getProfileByUsername(user!.username);
      if (!result.data) {
        setNotFound(true);
      } else {
        setProfile(result.data);
      }
      setLoading(false);
    }

    load();
  }, [user, userLoading, isLoggedIn, router]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <Loader2 size={28} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary-bg px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Profile পাওয়া যায়নি
        </h1>
        <p className="text-text-muted text-sm mt-2">
          আবার login করে চেষ্টা করো।
        </p>
      </div>
    );
  }

  return <ProfileEditForm profile={profile} />;
}