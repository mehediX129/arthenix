import { createClient } from "@/lib/supabase/client";
import type {
  Order,
  OrderInsert,
  OrderWithProduct,
  DbResult,
} from "@/types/database";

/**
 * নতুন order তৈরি করে (checkout সম্পন্ন হওয়ার পর কল হবে)।
 * Status ডিফল্টভাবে 'pending' থাকবে যতক্ষণ না Stripe payment confirm হয়।
 *
 * এই insert/update হলে Phase 3B এর XP trigger automatically fire হবে
 * (status 'completed' এ গেলে buyer +20 XP, seller +50 XP)।
 */
export async function createOrder(
  data: OrderInsert
): Promise<DbResult<Order>> {
  const supabase = createClient();

  const { data: created, error } = await supabase
    .from("orders")
    .insert(data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: created as Order, error: null };
}

/**
 * একজন buyer এর সব purchase history fetch করে, product details সহ।
 * Profile page এর "My Purchases" tab এ ব্যবহার হবে।
 */
export async function getUserPurchases(
  userId: string
): Promise<DbResult<OrderWithProduct[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, product:products(id, title, thumbnail_url, price)")
    .eq("buyer_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as OrderWithProduct[], error: null };
}

/**
 * একজন seller এর সব sales fetch করে — তার product গুলোর বিপরীতে হওয়া অর্ডার।
 * Seller Dashboard / Profile page এর "Sales" tab এ ব্যবহার হবে।
 *
 * এখানে inner join প্যাটার্ন ব্যবহার করা হয়েছে: orders থেকে শুরু করে
 * products এর মাধ্যমে seller_id ফিল্টার করা হচ্ছে, কারণ orders টেবিলে
 * সরাসরি seller_id কলাম নেই (schema অনুযায়ী)।
 */
export async function getSellerSales(
  sellerId: string
): Promise<DbResult<OrderWithProduct[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, product:products!inner(id, title, thumbnail_url, price, seller_id)")
    .eq("product.seller_id", sellerId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as OrderWithProduct[], error: null };
}