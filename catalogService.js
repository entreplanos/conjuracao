import { getItem, setItem, deleteItem, listByPrefix } from "./store.js";
import { supabase } from "./supabaseClient.js";

// ---------- Catálogo (itens) ----------
// Chave: cat:item:<itemId>

export async function listCatalogItems() {
  const rows = await listByPrefix("cat:item:");
  return rows.map((r) => ({ id: r.key.replace("cat:item:", ""), ...r.value }));
}

export async function saveCatalogItem(id, data) {
  const itemId = id || crypto.randomUUID();
  await setItem(`cat:item:${itemId}`, data);
  return itemId;
}

export async function deleteCatalogItem(id) {
  await deleteItem(`cat:item:${id}`);
}

export async function uploadItemImage(file) {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("conjuracao-catalogo").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("conjuracao-catalogo").getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Listas de separação ----------
// Chave meta:  cat:lista:meta:<code>   → { mesaCode, mesaDate, status, createdAt }
// Chave itens: cat:lista:itens:<code>  → [{ itemId, quantidade }]

export async function createLista(code) {
  await setItem(`cat:lista:meta:${code}`, {
    mesaCode: null,
    mesaDate: null,
    status: "rascunho",
    createdAt: new Date().toISOString(),
  });
  await setItem(`cat:lista:itens:${code}`, []);
}

export async function getListaMeta(code) {
  return getItem(`cat:lista:meta:${code}`);
}

export async function getListaItens(code) {
  const v = await getItem(`cat:lista:itens:${code}`);
  return Array.isArray(v) ? v : [];
}

export async function saveListaItens(code, itens) {
  await setItem(`cat:lista:itens:${code}`, itens);
}

export async function linkListaAMesa(code, mesaCode, mesaDate) {
  const meta = (await getListaMeta(code)) || { status: "rascunho", createdAt: new Date().toISOString() };
  await setItem(`cat:lista:meta:${code}`, { ...meta, mesaCode, mesaDate, status: "vinculada" });
}

export async function confirmarLista(code) {
  const meta = await getListaMeta(code);
  if (!meta) return;
  await setItem(`cat:lista:meta:${code}`, { ...meta, status: "confirmada" });
}

// ---------- Checagem de conflito de estoque ----------
// Soma a quantidade já reservada por OUTRAS listas vinculadas à mesma data,
// respeitando ordem de chegada (quem vinculou primeiro tem prioridade).
export async function getReservasDaData(mesaDate, excludeCode) {
  const metaRows = await listByPrefix("cat:lista:meta:");
  const listasNaData = metaRows
    .map((r) => ({ code: r.key.replace("cat:lista:meta:", ""), ...r.value }))
    .filter((l) => l.mesaDate === mesaDate && l.code !== excludeCode && l.status !== "rascunho")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const reservas = {}; // itemId -> quantidade total já reservada por outros
  for (const lista of listasNaData) {
    const itens = await getListaItens(lista.code);
    for (const { itemId, quantidade } of itens) {
      reservas[itemId] = (reservas[itemId] || 0) + quantidade;
    }
  }
  return reservas;
}

// ---------- Admin auth ----------
export async function adminSignIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function adminSignOut() {
  await supabase.auth.signOut();
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
  return data.subscription;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
