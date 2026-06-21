import { createClient } from "@/lib/supabase/client";
import type {
  Product,
  ProductInsert,
  ProductWithSeller,
  ProductFilters,
  PaginatedResult,
  DbResult,
} from "@/types/database";

const PRODUCT_SELLER_SELECT =
  "*, seller:profiles(id, username, display_name, avatar_url, level)";

/**
 * Marketplace এর জন্য products fetch করে, optional filters সহ।
 * Marketplace browse page (Phase 4) এর মূল ফাংশন।
 */
export async function getProducts(
  filters: ProductFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<DbResult<PaginatedResult<ProductWithSeller>>> {
  const supabase = createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("products")
    .select(PRODUCT_SELLER_SELECT, { count: "exact" })
    .eq("is_active", true);

  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.minPrice !== undefined) {
    query = query.gte("price", filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte("price", filters.maxPrice);
  }
  if (filters.minRating !== undefined) {
    query = query.gte("rating_avg", filters.minRating);
  }
  if (filters.sellerId) {
    query = query.eq("seller_id", filters.sellerId);
  }
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return { data: null, error: error.message };
  }

  const totalCount = count ?? 0;

  return {
    data: {
      data: data as unknown as ProductWithSeller[],
      count: totalCount,
      page,
      pageSize: limit,
      hasMore: from + limit < totalCount,
    },
    error: null,
  };
}

/**
 * একটা নির্দিষ্ট product এর সম্পূর্ণ details fetch করে, seller সহ।
 * Product detail page এর জন্য।
 */
export async function getProductById(
  id: string
): Promise<DbResult<ProductWithSeller>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELLER_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as ProductWithSeller, error: null };
}

/**
 * একজন নির্দিষ্ট seller এর সব active product fetch করে।
 * Seller profile page / "Shop" tab এ ব্যবহার হবে।
 */
export async function getProductsBySeller(
  sellerId: string
): Promise<DbResult<Product[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Product[], error: null };
}

/**
 * নতুন product listing তৈরি করে। seller_id RLS policy অনুযায়ী
 * logged-in user এর নিজের id হতে হবে।
 */
export async function createProduct(
  data: ProductInsert
): Promise<DbResult<Product>> {
  const supabase = createClient();

  const { data: created, error } = await supabase
    .from("products")
    .insert(data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: created as Product, error: null };
}

/**
 * Products এর মধ্যে full-text search করে
 * (Phase 3B এর search_content SQL function কল করে, শুধু product result গুলো ফিল্টার করে নেয়)।
 */
export async function searchProducts(
  query: string
): Promise<DbResult<Product[]>> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("search_content", {
    p_query: query,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  const productIds = (
    data as { result_type: string; id: string }[]
  )
    .filter((r) => r.result_type === "product")
    .map((r) => r.id);

  if (productIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds)
    .eq("is_active", true);

  if (productsError) {
    return { data: null, error: productsError.message };
  }

  return { data: products as Product[], error: null };
}

/**
 * একটা product এর গত 30 দিনের price history fetch করে,
 * PriceHistory chart component এর জন্য।
 */
export async function getPriceHistory(
  productId: string
): Promise<DbResult<{ date: string; price: number }[]>> {
  const supabase = createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from("price_history")
    .select("price, recorded_at")
    .eq("product_id", productId)
    .gte("recorded_at", thirtyDaysAgo.toISOString())
    .order("recorded_at", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  const formatted = (data as { price: number; recorded_at: string }[]).map(
    (row) => ({
      date: row.recorded_at,
      price: row.price,
    })
  );

  return { data: formatted, error: null };
}

/**
 * গত 30 দিনের সর্বনিম্ন price বের করে
 * (Phase 4C prep এর get_lowest_price_30d SQL function কল করে)।
 */
export async function getLowestPrice30Days(
  productId: string
): Promise<DbResult<number | null>> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_lowest_price_30d", {
    p_product_id: productId,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as number | null, error: null };
}