"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera,
  Loader2,
  Check,
  X as XIcon,
  MapPin,
  Globe,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import { updateProfile, uploadAvatar, isUsernameAvailable } from "@/lib/db/profiles";
import { useUserStore } from "@/lib/store/user-store";
import { getInitials, getLevelColor } from "@/lib/utils/gamification";
import type { Profile } from "@/types/database";

interface ProfileEditFormProps {
  profile: Profile;
}

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const BIO_MAX = 280;
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const storeUser = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [twitterUrl, setTwitterUrl] = useState(profile.twitter_url ?? "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url ?? "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar_url
  );

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const debouncedUsername = useDebounce(username, 450);

  // ── Real-time username availability check ──────────────────
  useEffect(() => {
    const trimmed = debouncedUsername.trim().toLowerCase();

    if (trimmed === profile.username) {
      setUsernameStatus("idle");
      return;
    }
    if (!USERNAME_PATTERN.test(trimmed)) {
      setUsernameStatus(trimmed.length > 0 ? "invalid" : "idle");
      return;
    }

    let cancelled = false;
    setUsernameStatus("checking");

    isUsernameAvailable(trimmed, profile.id).then(({ data }) => {
      if (cancelled) return;
      setUsernameStatus(data ? "available" : "taken");
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedUsername, profile.id, profile.username]);

  // ── Avatar file select ───────────────────────────────────────
  const handleAvatarSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("শুধু image file বেছে নাও");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size ৫MB এর কম হতে হবে");
      return;
    }
    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleAvatarSelect(file);
  }

  const isUsernameBlocking =
    usernameStatus === "taken" ||
    usernameStatus === "invalid" ||
    usernameStatus === "checking";

  async function handleSave() {
    if (isUsernameBlocking) return;
    setSaving(true);
    setError(null);

    let avatarUrl = profile.avatar_url;

    if (avatarFile) {
      const { data: uploadedUrl, error: uploadErr } = await uploadAvatar(
        profile.id,
        avatarFile
      );
      if (uploadErr) {
        setError(uploadErr);
        setSaving(false);
        return;
      }
      avatarUrl = uploadedUrl;
    }

    const finalUsername = username.trim().toLowerCase();

    const { data: updated, error: updateErr } = await updateProfile(profile.id, {
      display_name: displayName.trim() || null,
      username: finalUsername,
      bio: bio.trim() || null,
      location: location.trim() || null,
      avatar_url: avatarUrl,
      twitter_url: twitterUrl.trim() || null,
      github_url: githubUrl.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
    });

    if (updateErr || !updated) {
      setError(updateErr ?? "কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করো");
      setSaving(false);
      return;
    }

    // Navbar/global store-এ avatar+username সাথে সাথে আপডেট হয়ে যাক
    if (storeUser) {
      setUser({ ...storeUser, username: finalUsername, avatar_url: avatarUrl });
    }

    setSaving(false);
    setSuccess(true);
    setTimeout(() => {
      router.push(`/profile/${finalUsername}`);
    }, 900);
  }

  const levelColor = getLevelColor(profile.level);

  return (
    <div className="min-h-screen bg-primary-bg px-4 py-8 md:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display font-black text-2xl text-text-primary">
              Edit Profile
            </h1>
            <p className="text-text-muted text-xs font-mono mt-0.5">
              পরিবর্তন সাথে সাথেই সবার কাছে visible হবে
            </p>
          </div>
        </div>

        {/* Avatar card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-6 mb-4 flex flex-col items-center"
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative w-24 h-24 rounded-full cursor-pointer group"
          >
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-2 font-display font-bold text-2xl text-white bg-gradient-to-br from-[#7C3AED] to-[#06B6D4]"
              style={{ borderColor: `${levelColor}55` }}
            >
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar preview"
                  width={96}
                  height={96}
                  unoptimized={avatarPreview.startsWith("blob:")}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(displayName || profile.username)
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarSelect(file);
            }}
          />
          <p className="font-mono text-xs text-text-muted mt-3">
            ক্লিক করো বা drag-drop করো (max 5MB)
          </p>
        </motion.div>

        {/* Basic info card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-6 mb-4 space-y-5"
        >
          {/* Display name */}
          <div>
            <label className="block font-mono text-xs text-text-muted mb-1.5">
              DISPLAY NAME
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              placeholder="তোমার নাম"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-text-primary placeholder:text-text-muted outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block font-mono text-xs text-text-muted mb-1.5">
              USERNAME
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                @
              </span>
              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
                }
                maxLength={20}
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-8 pr-10 py-2.5 text-text-primary outline-none focus:border-violet-500/50 transition-colors"
                style={
                  usernameStatus === "taken" || usernameStatus === "invalid"
                    ? { borderColor: "rgba(239,68,68,0.5)" }
                    : usernameStatus === "available"
                    ? { borderColor: "rgba(16,185,129,0.5)" }
                    : undefined
                }
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <Loader2 size={15} className="animate-spin text-text-muted" />
                )}
                {usernameStatus === "available" && (
                  <Check size={15} className="text-emerald-400" />
                )}
                {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                  <XIcon size={15} className="text-red-400" />
                )}
              </span>
            </div>
            {usernameStatus === "taken" && (
              <p className="text-xs text-red-400 mt-1.5">এই username আগে থেকেই নেওয়া আছে</p>
            )}
            {usernameStatus === "invalid" && (
              <p className="text-xs text-red-400 mt-1.5">
                শুধু lowercase letter, number, underscore — ৩-২০ character
              </p>
            )}
            {usernameStatus === "available" && (
              <p className="text-xs text-emerald-400 mt-1.5">এই username পাওয়া যাচ্ছে ✓</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-xs text-text-muted">BIO</label>
              <span
                className="font-mono text-[11px]"
                style={{
                  color: bio.length > BIO_MAX - 20 ? "#F59E0B" : "var(--text-muted)",
                }}
              >
                {bio.length}/{BIO_MAX}
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              rows={3}
              placeholder="নিজের সম্পর্কে কিছু লেখো..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-text-primary placeholder:text-text-muted outline-none focus:border-violet-500/50 transition-colors resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block font-mono text-xs text-text-muted mb-1.5">
              LOCATION
            </label>
            <div className="relative">
              <MapPin
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={60}
                placeholder="Dhaka, Bangladesh"
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-text-primary placeholder:text-text-muted outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Social links card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-6 mb-6 space-y-4"
        >
          <p className="font-mono text-xs text-text-muted mb-1">SOCIAL LINKS</p>

          <SocialInput
            icon={<span className="text-[15px] font-bold">𝕏</span>}
            iconColor="#E2E8F0"
            value={twitterUrl}
            onChange={setTwitterUrl}
            placeholder="https://x.com/username"
          />
          <SocialInput
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.08.78 2.17 0 1.56-.02 2.83-.02 3.22 0 .31.21.67.8.56A10.98 10.98 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
              </svg>
            }
            iconColor="#E2E8F0"
            value={githubUrl}
            onChange={setGithubUrl}
            placeholder="https://github.com/username"
          />
          <SocialInput
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
              </svg>
            }
            iconColor="#0A66C2"
            value={linkedinUrl}
            onChange={setLinkedinUrl}
            placeholder="https://linkedin.com/in/username"
          />
          <SocialInput
            icon={<Globe size={16} />}
            iconColor="#06B6D4"
            value={websiteUrl}
            onChange={setWebsiteUrl}
            placeholder="https://your-site.com"
          />
        </motion.div>

        {/* Error / success message */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 mb-4 text-sm text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 mb-4 text-sm text-emerald-300 flex items-center gap-2">
            <Check size={15} /> Profile আপডেট হয়ে গেছে!
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            disabled={saving}
            className="flex-1 py-3 rounded-xl font-display font-bold text-text-secondary border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || isUsernameBlocking}
            className="flex-1 py-3 rounded-xl font-display font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Small reusable social link input ────────────────────────
function SocialInput({
  icon,
  iconColor,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  iconColor: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
        style={{ background: `${iconColor}18`, color: iconColor }}
      >
        {icon}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-violet-500/50 transition-colors"
      />
    </div>
  );
}