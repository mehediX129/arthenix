export type UserLevel =
  | "Novice"
  | "Explorer"
  | "Scholar"
  | "Architect"
  | "Mastermind"
  | "Legend";

interface LevelTier {
  level: UserLevel;
  minXP: number;
  maxXP: number | null; // null মানে infinite (top tier)
  color: string;
}

export const LEVEL_TIERS: LevelTier[] = [
  { level: "Novice", minXP: 0, maxXP: 499, color: "#94A3B8" },
  { level: "Explorer", minXP: 500, maxXP: 1999, color: "#06B6D4" },
  { level: "Scholar", minXP: 2000, maxXP: 4999, color: "#10B981" },
  { level: "Architect", minXP: 5000, maxXP: 14999, color: "#7C3AED" },
  { level: "Mastermind", minXP: 15000, maxXP: 49999, color: "#EC4899" },
  { level: "Legend", minXP: 50000, maxXP: null, color: "#F59E0B" },
];

/**
 * একটা XP value থেকে user-এর বর্তমান Level বের করে।
 */
export function getLevelFromXP(xp: number): UserLevel {
  const tier = LEVEL_TIERS.find(
    (t) => xp >= t.minXP && (t.maxXP === null || xp <= t.maxXP)
  );
  return tier ? tier.level : "Novice";
}

/**
 * Level অনুযায়ী badge color রিটার্ন করে — UI তে consistent ব্যবহারের জন্য।
 */
export function getLevelColor(level: UserLevel): string {
  const tier = LEVEL_TIERS.find((t) => t.level === level);
  return tier ? tier.color : LEVEL_TIERS[0].color;
}

/**
 * বর্তমান XP থেকে পরের Level পর্যন্ত progress percentage (0-100) বের করে।
 * Progress bar UI-তে সরাসরি ব্যবহারযোগ্য।
 */
export function getProgressToNextLevel(xp: number): {
  percentage: number;
  currentLevel: UserLevel;
  nextLevel: UserLevel | null;
  xpIntoLevel: number;
  xpNeededForNext: number | null;
} {
  const tierIndex = LEVEL_TIERS.findIndex(
    (t) => xp >= t.minXP && (t.maxXP === null || xp <= t.maxXP)
  );
  const currentTier = LEVEL_TIERS[tierIndex] ?? LEVEL_TIERS[0];
  const nextTier = LEVEL_TIERS[tierIndex + 1] ?? null;

  const xpIntoLevel = xp - currentTier.minXP;

  // Legend (top tier) হলে progress সবসময় 100%
  if (!nextTier) {
    return {
      percentage: 100,
      currentLevel: currentTier.level,
      nextLevel: null,
      xpIntoLevel,
      xpNeededForNext: null,
    };
  }

  const levelRange = nextTier.minXP - currentTier.minXP;
  const percentage = Math.min(
    100,
    Math.round((xpIntoLevel / levelRange) * 100)
  );

  return {
    percentage,
    currentLevel: currentTier.level,
    nextLevel: nextTier.level,
    xpIntoLevel,
    xpNeededForNext: nextTier.minXP - xp,
  };
}

/**
 * Username বা full name থেকে initials বের করে — Avatar fallback-এর জন্য।
 * "Arthexi Rahman" → "AR", "Arthexi" → "AR" (single word হলে প্রথম দুই অক্ষর)
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}