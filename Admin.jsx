import { useState, useRef, useMemo, useEffect } from "react";
import { Upload, X, Plus, Pencil, Trash2, Search, ImageOff, ShieldCheck, LogOut, ArrowLeft } from "lucide-react";
import { PALETTE, CATEGORIES, UNIT_TYPES, FONT_IMPORT } from "./tokens.js";
import {
  listCatalogItems,
  saveCatalogItem,
  deleteCatalogItem,
  uploadItemImage,
  adminSignIn,
  adminSignOut,
  onAuthChange,
  getCurrentUser,
} from "./catalogService.js";

const EMPTY_FORM = { id: null, name: "", category: "miniatura", stock: "", tags: [], imageUrl: null, unitType: null };

function CategoryIcon({ category, size = 16, color }) {
  const cat = CATEGORIES.find((c) => c.id === category);
  const Icon = cat ? cat.icon : CATEGORIES[0].icon;
  return <Icon size={size} color={color} />;
}

function LoginGate({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const user = await adminSignIn(email, password);
      onSuccess(user);
    } catch (e) {
      setError("Credenciais inválidas. O selo permanece fechado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "min(340px, 100%)", background: `linear-gradient(160deg, ${PALETTE.card}, #221a12)`, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 4, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(circle at 35% 30%, ${PALETTE.goldLight}, ${PALETTE.ember} 70%)`, boxShadow: "0 0 16px rgba(205,164,52,0.4)" }}>
            <ShieldCheck size={20} color="#1a1208" />
          </div>
        </div>
        <h2 style={{ fontFamily: "Cinzel, serif", fontSize: 16, color: PALETTE.gold, textAlign: "center", margin: "0 0 4px", letterSpacing: 0.5 }}>Selo do Guardião</h2>
        <p style={{ fontFamily: "Spectral, serif", fontSize: 12, color: PALETTE.muted, textAlign: "center", margin: "0 0 20px" }}>Acesso do Mestre de Cerimônias.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            style={{ width: "100%", background: PALETTE.bg, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, padding: "11px 14px", color: PALETTE.parchment, fontFamily: "Spectral, serif", fontSize: 14 }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Senha"
            style={{ width: "100%", background: PALETTE.bg, border: `1px solid ${error ? PALETTE.blood : PALETTE.cardBorder}`, borderRadius: 2, padding: "11px 14px", color: PALETTE.parchment, fontFamily: "Spectral, serif", fontSize: 14 }}
          />
        </div>

        {error && <div style={{ fontFamily: "Spectral, serif", fontSize: 11, color: "#e2897f", textAlign: "center", marginTop: 10 }}>{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: "100%", marginTop: 16, fontFamily: "Cinzel, serif", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: "#1a1208", background: `linear-gradient(135deg, ${PALETTE.gold}, ${PALETTE.ember})`, border: "none", borderRadius: 2, padding: "11px", cursor: loading ? "wait" : "pointer" }}
        >
          {loading ? "Abrindo..." : "Abrir o Selo"}
        </button>
      </div>
    </div>
  );
}

export default function Admin({ navigate }) {
  const [user, setUser] = useState(undefined); // undefined = checking, null = logged out
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagDraft, setTagDraft] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("todas");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const isEditing = form.id !== null;

  useEffect(() => {
    getCurrentUser().then(setUser);
    const sub = onAuthChange(setUser);
    return () => sub?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingItems(true);
      const rows = await listCatalogItems();
      setItems(rows);
      setLoadingItems(false);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || (i.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = filterCategory === "todas" || i.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, filterCategory]);

  const allTagsUsed = useMemo(() => [...new Set(items.flatMap((i) => i.tags || []))].sort(), [items]);

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadItemImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      alert("Falha ao enviar a imagem. Confira se o bucket 'conjuracao-catalogo' existe e está público.");
    } finally {
      setUploading(false);
    }
  }

  function addTag() {
    const tag = tagDraft.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    setTagDraft("");
  }
  function removeTag(tag) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }
  function resetForm() {
    setForm(EMPTY_FORM);
    setTagDraft("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    if (!form.name.trim() || form.stock === "" || Number(form.stock) < 0) return;
    const payload = {
      name: form.name.trim(),
      category: form.category,
      stock: Number(form.stock),
      tags: form.tags,
      imageUrl: form.imageUrl,
      unitType: form.unitType,
    };
    const id = await saveCatalogItem(form.id, payload);
    if (isEditing) {
      setItems((prev) => prev.map((i) => (i.id === id ? { id, ...payload } : i)));
    } else {
      setItems((prev) => [...prev, { id, ...payload }]);
    }
    resetForm();
  }

  function handleEdit(item) {
    setForm({ ...item, stock: String(item.stock) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Remover este item do catálogo? Isso não afeta listas já vinculadas.")) return;
    await deleteCatalogItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (form.id === id) resetForm();
  }

  const canSave = form.name.trim() && form.stock !== "" && Number(form.stock) >= 0;

  if (user === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", alignItems: "center", justifyContent: "center", color: PALETTE.muted, fontFamily: "Spectral, serif" }}>
        <style>{FONT_IMPORT}</style>
        Verificando o selo...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse at top, ${PALETTE.bg2}, ${PALETTE.bg} 60%)`, color: PALETTE.parchment }}>
        <style>{`${FONT_IMPORT} * { box-sizing: border-box; } ::placeholder { color: ${PALETTE.mutedDark}; } input:focus { outline: none; border-color: ${PALETTE.gold} !important; }`}</style>
        <LoginGate onSuccess={setUser} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse at top, ${PALETTE.bg2}, ${PALETTE.bg} 60%)`, fontFamily: "Spectral, serif", color: PALETTE.parchment, padding: "36px 20px 80px" }}>
      <style>{`${FONT_IMPORT} * { box-sizing: border-box; } ::placeholder { color: ${PALETTE.mutedDark}; } input:focus, select:focus { outline: none; border-color: ${PALETTE.gold} !important; }`}</style>

      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
          <div>
            <button onClick={() => navigate("home")} style={{ background: "none", border: "none", color: PALETTE.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "Spectral, serif", fontSize: 12, marginBottom: 10 }}>
              <ArrowLeft size={14} /> selo
            </button>
            <span style={{ fontFamily: "Spectral, serif", fontSize: 11, letterSpacing: 3, color: PALETTE.muted, textTransform: "uppercase" }}>
              Conjuração · Painel do Mestre de Cerimônias
            </span>
            <h1 style={{ fontFamily: "Cinzel, serif", fontWeight: 700, fontSize: 30, color: PALETTE.gold, margin: "6px 0 0", letterSpacing: 1 }}>Cadastro do Catálogo</h1>
          </div>
          <button
            onClick={() => adminSignOut()}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, padding: "8px 12px", color: PALETTE.muted, cursor: "pointer", fontFamily: "Spectral, serif", fontSize: 12 }}
          >
            <LogOut size={13} /> Sair
          </button>
        </div>

        <div style={{ background: `linear-gradient(160deg, ${PALETTE.card}, #221a12)`, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 4, padding: 24, marginBottom: 40 }}>
          <h2 style={{ fontFamily: "Cinzel, serif", fontSize: 16, color: PALETTE.parchment, margin: "0 0 18px", letterSpacing: 0.5 }}>{isEditing ? "Editar item" : "Novo item"}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 24 }}>
            <div>
              <label style={{ fontFamily: "Spectral, serif", fontSize: 12, color: PALETTE.muted, display: "block", marginBottom: 8 }}>Foto</label>
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{ width: 140, height: 140, border: `1px dashed ${PALETTE.cardBorder}`, borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: uploading ? "wait" : "pointer", overflow: "hidden", background: PALETTE.bg, position: "relative" }}
              >
                {form.imageUrl ? (
                  <>
                    <img src={form.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={(e) => { e.stopPropagation(); setForm((f) => ({ ...f, imageUrl: null })); }} style={{ position: "absolute", top: 4, right: 4, background: "rgba(20,16,12,0.8)", border: "none", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: PALETTE.parchment }}>
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload size={20} color={PALETTE.mutedDark} />
                    <span style={{ fontFamily: "Spectral, serif", fontSize: 11, color: PALETTE.mutedDark, marginTop: 8, textAlign: "center", padding: "0 10px" }}>
                      {uploading ? "Enviando..." : "Enviar foto"}
                    </span>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontFamily: "Spectral, serif", fontSize: 12, color: PALETTE.muted, display: "block", marginBottom: 6 }}>Nome</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Dragão Vermelho Jovem" style={{ width: "100%", background: PALETTE.bg, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, padding: "10px 12px", color: PALETTE.parchment, fontFamily: "Spectral, serif", fontSize: 14 }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 16 }}>
                <div>
                  <label style={{ fontFamily: "Spectral, serif", fontSize: 12, color: PALETTE.muted, display: "block", marginBottom: 6 }}>Categoria</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {CATEGORIES.map((c) => {
                      const active = form.category === c.id;
                      const Icon = c.icon;
                      return (
                        <button key={c.id} onClick={() => setForm((f) => ({ ...f, category: c.id, unitType: c.id === "terreno" ? "pack" : c.id === "objeto" ? f.unitType || "individual" : null }))}
                          style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Cinzel, serif", fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase", color: active ? "#1a1208" : PALETTE.parchment, background: active ? PALETTE.gold : "transparent", border: `1px solid ${active ? PALETTE.gold : PALETTE.cardBorder}`, borderRadius: 2, padding: "9px 12px", cursor: "pointer", flex: 1, justifyContent: "center" }}>
                          <Icon size={13} /> {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label style={{ fontFamily: "Spectral, serif", fontSize: 12, color: PALETTE.muted, display: "block", marginBottom: 6 }}>Estoque</label>
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} placeholder="0" style={{ width: "100%", background: PALETTE.bg, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, padding: "10px 12px", color: PALETTE.parchment, fontFamily: "Spectral, serif", fontSize: 14 }} />
                </div>
              </div>

              {form.category !== "miniatura" && (
                <div>
                  <label style={{ fontFamily: "Spectral, serif", fontSize: 12, color: PALETTE.muted, display: "block", marginBottom: 6 }}>Unidade</label>
                  {form.category === "terreno" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", fontFamily: "Spectral, serif", fontSize: 12, color: PALETTE.muted, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, padding: "8px 12px" }}>
                      Terreno sempre em pack
                    </span>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      {UNIT_TYPES.map((u) => {
                        const active = form.unitType === u.id;
                        return (
                          <button key={u.id} onClick={() => setForm((f) => ({ ...f, unitType: u.id }))} style={{ fontFamily: "Cinzel, serif", fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase", color: active ? "#1a1208" : PALETTE.parchment, background: active ? PALETTE.gold : "transparent", border: `1px solid ${active ? PALETTE.gold : PALETTE.cardBorder}`, borderRadius: 2, padding: "8px 16px", cursor: "pointer" }}>
                            {u.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={{ fontFamily: "Spectral, serif", fontSize: 12, color: PALETTE.muted, display: "block", marginBottom: 6 }}>Tags</label>
                {allTagsUsed.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {allTagsUsed.map((tag) => {
                      const active = form.tags.includes(tag);
                      return (
                        <button key={tag} onClick={() => (active ? removeTag(tag) : setForm((f) => ({ ...f, tags: [...f.tags, tag] })))} style={{ fontFamily: "Spectral, serif", fontSize: 11, color: active ? "#1a1208" : PALETTE.muted, background: active ? PALETTE.goldLight : "transparent", border: `1px solid ${active ? PALETTE.goldLight : PALETTE.mutedDark}`, borderRadius: 12, padding: "4px 11px", cursor: "pointer" }}>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginBottom: form.tags.length > 0 ? 8 : 0 }}>
                  <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Criar tag nova..." style={{ flex: 1, background: PALETTE.bg, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, padding: "9px 12px", color: PALETTE.parchment, fontFamily: "Spectral, serif", fontSize: 13 }} />
                  <button onClick={addTag} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, background: "transparent", border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, color: PALETTE.gold, cursor: "pointer" }}>
                    <Plus size={15} />
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {form.tags.map((tag) => (
                    <span key={tag} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "Spectral, serif", fontSize: 11, color: PALETTE.goldLight, border: `1px solid ${PALETTE.mutedDark}`, borderRadius: 12, padding: "3px 6px 3px 10px" }}>
                      {tag}
                      <X size={11} style={{ cursor: "pointer" }} onClick={() => removeTag(tag)} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
            {isEditing && (
              <button onClick={resetForm} style={{ fontFamily: "Cinzel, serif", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: PALETTE.muted, background: "transparent", border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, padding: "10px 18px", cursor: "pointer" }}>
                Cancelar
              </button>
            )}
            <button onClick={handleSave} disabled={!canSave} style={{ fontFamily: "Cinzel, serif", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: canSave ? "#1a1208" : PALETTE.mutedDark, background: canSave ? `linear-gradient(135deg, ${PALETTE.gold}, ${PALETTE.ember})` : "transparent", border: `1px solid ${canSave ? "transparent" : PALETTE.cardBorder}`, borderRadius: 2, padding: "10px 22px", cursor: canSave ? "pointer" : "not-allowed" }}>
              {isEditing ? "Salvar alterações" : "Cadastrar item"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontFamily: "Cinzel, serif", fontSize: 16, color: PALETTE.parchment, margin: 0, letterSpacing: 0.5 }}>Catálogo ({filtered.length})</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} color={PALETTE.mutedDark} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nome ou tag..." style={{ background: PALETTE.card, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, padding: "8px 10px 8px 30px", color: PALETTE.parchment, fontFamily: "Spectral, serif", fontSize: 12, width: 200 }} />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ background: PALETTE.card, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, padding: "8px 10px", color: PALETTE.parchment, fontFamily: "Spectral, serif", fontSize: 12 }}>
              <option value="todas">Todas categorias</option>
              {CATEGORIES.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
            </select>
          </div>
        </div>

        {loadingItems ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: PALETTE.muted, fontFamily: "Spectral, serif", fontSize: 13 }}>Carregando catálogo...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, background: PALETTE.card, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 4, padding: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 3, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: PALETTE.bg, border: `1px solid ${PALETTE.cardBorder}` }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImageOff size={16} color={PALETTE.mutedDark} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "Cinzel, serif", fontSize: 14, color: PALETTE.parchment }}>{item.name}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "Spectral, serif", fontSize: 10, color: PALETTE.muted, border: `1px solid ${PALETTE.mutedDark}`, borderRadius: 10, padding: "2px 8px" }}>
                      <CategoryIcon category={item.category} size={11} color={PALETTE.muted} /> {CATEGORIES.find((c) => c.id === item.category)?.label}
                    </span>
                    {item.unitType && (
                      <span style={{ fontFamily: "Spectral, serif", fontSize: 10, color: PALETTE.mutedDark, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 10, padding: "2px 8px" }}>
                        {UNIT_TYPES.find((u) => u.id === item.unitType)?.label}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                    {(item.tags || []).map((t) => (<span key={t} style={{ fontFamily: "Spectral, serif", fontSize: 10, color: PALETTE.mutedDark }}>#{t}</span>))}
                  </div>
                </div>
                <div style={{ fontFamily: "Cinzel, serif", fontSize: 13, color: item.stock === 0 ? PALETTE.blood : PALETTE.goldLight, minWidth: 70, textAlign: "center" }}>
                  {item.stock} {item.stock === 1 ? "un." : "uns."}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => handleEdit(item)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, color: PALETTE.gold, cursor: "pointer" }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, color: PALETTE.blood, cursor: "pointer" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: PALETTE.muted, fontFamily: "Spectral, serif", fontSize: 13 }}>Nenhum item cadastrado com esses filtros.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
