import { supabase } from "./supabaseClient.js";

export async function getItem(key) {
  const { data, error } = await supabase.from("kv").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return data ? data.value : null;
}

export async function setItem(key, value) {
  const { error } = await supabase.from("kv").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function deleteItem(key) {
  const { error } = await supabase.from("kv").delete().eq("key", key);
  if (error) throw error;
}

export async function listByPrefix(prefix) {
  const { data, error } = await supabase.from("kv").select("key, value").like("key", `${prefix}%`);
  if (error) throw error;
  return data || [];
}
