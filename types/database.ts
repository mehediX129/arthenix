// ============================================================
// ARTHENIX — Database TypeScript Types
// supabase/schema.sql এর সাথে সরাসরি sync রাখা হয়েছে।
// কোনো column schema.sql এ পরিবর্তন হলে এই ফাইলও আপডেট করতে হবে।
// ============================================================

// ------------------------------------------------------------
// ENUM TYPES (Postgres enum এর সাথে মিলিয়ে)
// ------------------------------------------------------------
export type ComplexityLevel = "quick" | "standard" | "deep";
export type ProductCategory = "course" | "ebook" | "asset" | "gaming" | "tool";
export type OrderStatus = "pending" | "completed" | "refunded";
export type BadgeTier = "common" | "rare" | "epic" | "legendary";

export type UserLevel =
  | "Novice"
  | "Explorer"
  | "Scholar"
  | "Architect"
  | "Mastermind"
  | "Legend";

// ------------------------------------------------------------
// 1. PROFILES
// ------------------------------------------------------------
export type ProfileVisibility = "public" | "private";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  xp: number;
  level: UserLevel;
  streak_days: number;
  last_active: string | null; // ISO timestamp
  selected_worlds: string[];
  is_seller: boolean;
  onboarding_complete: boolean;
  profile_visibility: ProfileVisibility;
  show_activity_feed: boolean;
  show_purchases: boolean;
  created_at: string;
  freeze_count: number;
  last_active_date: string | null;
}

// insert এর সময় যেসব field optional (DB default আছে)
export type ProfileInsert = Partial<
  Omit<Profile, "id" | "username">
> & {
  id: string;
  username: string;
};

export type ProfileUpdate = Partial<Omit<Profile, "id">>;

// ------------------------------------------------------------
// 2. WORLDS
// ------------------------------------------------------------
export interface World {
  id: string;
  name: string;
  tagline: string | null;
  color: string;
  article_count: number;
  is_active: boolean;
}

// ------------------------------------------------------------
// 3. ARTICLES
// ------------------------------------------------------------
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  world_id: string | null;
  author_id: string | null;
  read_time_minutes: number;
  read_time: number;
  complexity_level: ComplexityLevel;
  views: number;
  views_count: number;
  likes: number;
  likes_count: number;
  is_published: boolean;
  published_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type ArticleInsert = Partial<
  Omit<Article, "id" | "title" | "slug" | "content" | "created_at" | "updated_at">
> & {
  title: string;
  slug: string;
  content: string;
};

export type ArticleUpdate = Partial<Omit<Article, "id" | "created_at">>;

// Article এর সাথে author/world এর joined তথ্য — list view তে দরকার হয়
export interface ArticleWithRelations extends Article {
  author?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url"> | null;
  world?: Pick<World, "id" | "name" | "color"> | null;
}

// Article এর সাথে author/world এর joined তথ্য — detail view তে দরকার হয়
export interface ArticleLike {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}
export interface ArticleWithAuthor extends Article {
  author: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "level"> | null;
}

// ------------------------------------------------------------
// 4. PRODUCTS
// ------------------------------------------------------------
export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: ProductCategory;
  seller_id: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  sales_count: number;
  rating_avg: number;
  rating_count: number;
  is_active: boolean;
  flash_sale_end: string | null;
  tags: string[];
  created_at: string;
}

export type ProductInsert = Partial<
  Omit<Product, "id" | "title" | "price" | "category" | "created_at">
> & {
  title: string;
  price: number;
  category: ProductCategory;
};

export type ProductUpdate = Partial<Omit<Product, "id" | "created_at">>;

export interface ProductWithSeller extends Product {
  seller?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "level"> | null;
}

export interface ProductFilters {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sellerId?: string;
  tags?: string[];
}

// ------------------------------------------------------------
// 5. ORDERS
// ------------------------------------------------------------
export interface Order {
  id: string;
  buyer_id: string | null;
  product_id: string | null;
  amount_paid: number;
  stripe_payment_id: string | null;
  status: OrderStatus;
  created_at: string;
}

export type OrderInsert = Partial<
  Omit<Order, "id" | "amount_paid" | "created_at">
> & {
  amount_paid: number;
};

export interface OrderWithProduct extends Order {
  product?: Pick<Product, "id" | "title" | "thumbnail_url" | "price"> | null;
}

// ------------------------------------------------------------
// 6. REVIEWS
// ------------------------------------------------------------
export interface Review {
  id: string;
  product_id: string | null;
  reviewer_id: string | null;
  rating: number; // 1-5
  comment: string | null;
  helpful_count: number;
  created_at: string;
}

export type ReviewInsert = Partial<
  Omit<Review, "id" | "rating" | "created_at">
> & {
  rating: number;
};

export interface ReviewWithReviewer extends Review {
  reviewer?: Pick<Profile, "id" | "username" | "avatar_url"> | null;
}

// ------------------------------------------------------------
// 7. BADGES
// ------------------------------------------------------------
export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  tier: BadgeTier;
  condition_type: string;
  condition_value: number;
}

// ------------------------------------------------------------
// 8. USER_BADGES
// ------------------------------------------------------------
export interface UserBadge {
  id: string;
  user_id: string | null;
  badge_id: string | null;
  earned_at: string;
}

export interface UserBadgeWithBadge extends UserBadge {
  badge?: Badge | null;
}

// ------------------------------------------------------------
// 9. BOOKMARKS
// ------------------------------------------------------------
export interface Bookmark {
  id: string;
  user_id: string | null;
  article_id: string | null;
  created_at: string;
}

// ------------------------------------------------------------
// WISHLISTS (Phase 4 — Product wishlist, bookmarks থেকে পৃথক)
// ------------------------------------------------------------
export interface Wishlist {
  id: string;
  user_id: string | null;
  product_id: string | null;
  created_at: string;
}

export interface WishlistWithProduct extends Wishlist {
  product?: Pick<
    Product,
    "id" | "title" | "thumbnail_url" | "price" | "original_price"
  > | null;
}

// ------------------------------------------------------------
// 10. COMMENTS
// ------------------------------------------------------------
export interface Comment {
  id: string;
  article_id: string | null;
  author_id: string | null;
  content: string;
  likes: number;
  parent_id: string | null;
  created_at: string;
}

export type CommentInsert = Partial<
  Omit<Comment, "id" | "content" | "created_at">
> & {
  content: string;
};

export interface CommentWithAuthor extends Comment {
  author?: Pick<Profile, "id" | "username" | "avatar_url"> | null;
  replies?: CommentWithAuthor[];
}

// ------------------------------------------------------------
// RPC FUNCTION RETURN TYPES (supabase/functions_triggers.sql এর সাথে মিলিয়ে)
// ------------------------------------------------------------
export interface WorldAffinity {
  world_id: string;
  world_name: string;
  bookmark_count: number;
  affinity_score: number;
}

export interface SearchResult {
  result_type: "article" | "product";
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  rank: number;
}

// ------------------------------------------------------------
// GENERIC HELPER TYPES
// ------------------------------------------------------------
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface DbResult<T> {
  data: T | null;
  error: string | null;
}

// ------------------------------------------------------------
// PRICE HISTORY (Phase 4C — Product price tracking)
// ------------------------------------------------------------
export interface PriceHistory {
  id: string;
  product_id: string | null;
  price: number;
  recorded_at: string;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

// ------------------------------------------------------------
// QUESTS (Phase 5 — Gamification)
// ------------------------------------------------------------ 
export interface Quest {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  icon: string;
  quest_type: "daily" | "weekly";
  action_type: string;
  target_count: number;
  world_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  assigned_date: string;
  created_at: string;
}

// UserQuest এর সাথে Quest এর joined তথ্য — list view তে দরকার হয়
export interface UserQuestWithQuest extends UserQuest {
  quest: Quest;
}

// ------------------------------------------------------------
// STREAK FREEZE (Phase 5 — Gamification)
// ------------------------------------------------------------ 
export interface StreakFreeze {
  id: string;
  user_id: string;
  used_on: string;
  created_at: string;
}

// ------------------------------------------------------------
// USER ACTIVITY (Phase 5 — Gamification)
// ------------------------------------------------------------
export interface UserActivity {
  id: string;
  user_id: string;
  activity_date: string;
  activity_count: number;
  created_at: string;
}

// ------------------------------------------------------------
// POSTS (Phase 6 — Community)
// ------------------------------------------------------------
export interface Post {
  id: string;
  author_id: string;
  world_id: string | null;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// Post এর সাথে author/world এর joined তথ্য — list view তে দরকার হয়
export interface PostLike {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

// PostComment এর সাথে author এর joined তথ্য — list view তে দরকার হয়
export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  likes_count: number;
  created_at: string;
}

// Post এর সাথে author/world এর joined তথ্য — list view তে দরকার হয়
export interface PostWithAuthor extends Post {
  author: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "level"> | null;
}

export interface PostCommentWithAuthor extends PostComment {
  author: Pick<Profile, "id" | "username" | "display_name" | "avatar_url"> | null;
}

// ------------------------------------------------------------
// SEARCH RESULTS (Phase 6 — Community)
// ------------------------------------------------------------
export interface ArticleSearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  world_id: string | null;
  author_id: string;
  read_time_minutes: number;
  views: number;
  likes: number;
  rank: number;
}

export interface ProductSearchResult {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  category: string;
  rating_avg: number;
  rank: number;
}

export interface UserSearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: string;
  xp: number;
}

export interface SearchResults {
  articles: ArticleSearchResult[];
  products: ProductSearchResult[];
  users: UserSearchResult[];
}

// ─── Notification ────────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type:
    | "article_like"
    | "article_comment"
    | "post_like"
    | "post_comment"
    | "new_follower"
    | "xp_milestone"
    | "level_up"
    | "quest_complete";
  entity_type: "article" | "post" | "product" | null;
  entity_id: string | null;
  entity_title: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationWithActor extends Notification {
  actor_username: string | null;
  actor_display_name: string | null;
  actor_avatar_url: string | null;
}
