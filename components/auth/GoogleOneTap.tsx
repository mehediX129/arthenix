"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureProfileAfterOAuth } from "@/lib/auth/post-oauth";

// ─── Google Identity Services types (minimal — full SDK is much bigger) ──

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  nonce?: string;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  itp_support?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

interface GoogleOneTapProps {
  /** নতুন user (প্রথমবার Google দিয়ে সাইন-ইন) — onboarding flow শুরু করতে হবে */
  onNewUser: (userId: string, firstName: string) => void;
  /** আগে থেকেই account আছে এমন user — সরাসরি app-এ ঢুকিয়ে দিতে হবে */
  onExistingUser: () => void;
  onError?: (message: string) => void;
}

/**
 * Google One Tap — page load হলেই ব্রাউজারে logged-in থাকা Google
 * account(s) দিয়ে ছোট popup দেখায়, ক্লিক করলেই সরাসরি সাইন-ইন হয়ে
 * যায় — কোনো full-page redirect ছাড়াই। এটা button-based OAuth flow-এর
 * (lib/auth/oauth.ts) পাশাপাশি একটা bonus shortcut হিসেবে কাজ করে;
 * এই component কোনো visible UI render করে না।
 *
 * নিরাপত্তার জন্য SHA-256 hashed nonce ব্যবহার করা হয়েছে — Google-কে
 * hashed নন্স পাঠানো হয়, আর raw নন্স Supabase-কে পাঠানো হয় verify করার
 * জন্য, যাতে token replay আটকানো যায় (Google + Supabase-এর official
 * নন্স pattern)।
 */
export default function GoogleOneTap({
  onNewUser,
  onExistingUser,
  onError,
}: GoogleOneTapProps) {
  const initialized = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || initialized.current) return;

    let cancelled = false;

    async function generateNonce(): Promise<[raw: string, hashed: string]> {
      const raw = crypto.randomUUID();
      const encoded = new TextEncoder().encode(raw);
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
      const hashed = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return [raw, hashed];
    }

    function loadScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }
        const existing = document.querySelector<HTMLScriptElement>(
          `script[src="${SCRIPT_SRC}"]`
        );
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () => reject(new Error("gsi load failed")));
          return;
        }
        const script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("gsi load failed"));
        document.head.appendChild(script);
      });
    }

    async function start() {
      const [rawNonce, hashedNonce] = await generateNonce();
      if (cancelled) return;

      async function handleCredential(response: GoogleCredentialResponse) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
          nonce: rawNonce,
        });

        if (cancelled) return;

        if (error || !data.user) {
          onError?.(
            "Google sign-in failed. Please try again or use email/password."
          );
          return;
        }

        const result = await ensureProfileAfterOAuth(supabase, data.user);
        if (cancelled) return;

        if (result.isNewUser) {
          onNewUser(result.userId, result.firstName);
        } else {
          onExistingUser();
        }
      }

      try {
        await loadScript();
      } catch {
        // Script load ব্যর্থ হলে চুপচাপ থেমে যাওয়া হয় — button দিয়ে
        // Google sign-in তো আছেই, One Tap শুধু একটা বাড়তি shortcut।
        return;
      }

      if (cancelled || !window.google?.accounts?.id) return;

      initialized.current = true;
      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: handleCredential,
        nonce: hashedNonce,
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      });
      window.google.accounts.id.prompt();
    }

    start();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}  