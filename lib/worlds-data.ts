export interface World {
  id: string;
  name: string;
  color: string;
  tagline: string;
  count: string;
  trending: string;
  emoji: string;
}

export const worlds: World[] = [
  {
    id: "gaming",
    name: "Gaming Nexus",
    color: "#7C3AED",
    tagline: "Every game. Every meta. Every legend.",
    count: "847K",
    trending: "Elden Ring lore explained",
    emoji: "🎮",
  },
  {
    id: "intelligence",
    name: "Intelligence Lab",
    color: "#06B6D4",
    tagline: "Train your mind like a weapon.",
    count: "234K",
    trending: "Feynman technique deep dive",
    emoji: "🧠",
  },
  {
    id: "psychology",
    name: "Psychology Vault",
    color: "#EC4899",
    tagline: "Understand humans. Starting with yourself.",
    count: "312K",
    trending: "Dark triad personality breakdown",
    emoji: "🧬",
  },
  {
    id: "anime",
    name: "Anime Dimension",
    color: "#F59E0B",
    tagline: "From Ghibli to God-tier. All of it.",
    count: "923K",
    trending: "Attack on Titan's true message",
    emoji: "⚔️",
  },
  {
    id: "science",
    name: "Science Reactor",
    color: "#10B981",
    tagline: "Reality is stranger than fiction.",
    count: "445K",
    trending: "Quantum entanglement explained",
    emoji: "🔭",
  },
  {
    id: "tech",
    name: "Tech Underground",
    color: "#3B82F6",
    tagline: "Build. Break. Repeat.",
    count: "567K",
    trending: "LLMs from scratch",
    emoji: "💻",
  },
  {
    id: "math",
    name: "Math Realm",
    color: "#8B5CF6",
    tagline: "Math is the language the universe speaks.",
    count: "189K",
    trending: "Riemann Hypothesis visualized",
    emoji: "➗",
  },
  {
    id: "inventions",
    name: "Inventions Archive",
    color: "#F97316",
    tagline: "Ideas that changed everything.",
    count: "156K",
    trending: "Tesla's lost inventions",
    emoji: "⚗️",
  },
  {
    id: "novels",
    name: "Novel Universe",
    color: "#D97706",
    tagline: "Stories that rewired civilization.",
    count: "278K",
    trending: "Dostoevsky's psychology",
    emoji: "📚",
  },
  {
    id: "marketplace",
    name: "Marketplace Hub",
    color: "#06B6D4",
    tagline: "Buy smart. Sell sharp. Win always.",
    count: "156K",
    trending: "Top selling UI kits",
    emoji: "🛒",
  },
  {
    id: "services",
    name: "Services Grid",
    color: "#14B8A6",
    tagline: "Skills meet opportunity.",
    count: "89K",
    trending: "Hire top dev",
    emoji: "🔧",
  },
  {
    id: "culture",
    name: "Culture Feed",
    color: "#EC4899",
    tagline: "Trends, vibes, and the zeitgeist.",
    count: "445K",
    trending: "Gen Z philosophy",
    emoji: "🌐",
  },
];