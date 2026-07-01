import { useState, useEffect, useMemo } from "react";
import { Search, X, Plus, Minus, ScrollText, Link2, Check, ArrowLeft } from "lucide-react";
import { PALETTE, CATEGORIES, FONT_IMPORT } from "./tokens.js";
import EmberCanvas from "./EmberCanvas.jsx";
import {
  listCatalogItems,
  createLista,
  getListaMeta,
  getListaItens,
  saveListaItens,
  linkListaAMesa,
  confirmarLista,
  getReservasDaData,
} from "./catalogService.js";

function genCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
}

function Seal({ Icon, active }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active
          ? `radial-gradient(circle at 35% 30%, ${PALETTE.goldLight}, ${PALETTE.ember} 70%)`
          : `radial-gradient(circle at 35% 30%, #3a2e1d, #221a10 70%)`,
        border: `1px solid ${active ? PALETTE.gold : PALETTE.cardBorder}`,
        boxShadow: active ? `0 0 12px rgba(205,164,52,0.55)` : "none",
        transition: "all 0.4s ease",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <Icon size={18} color={active ? "#1a1208" : PALETTE.muted} strokeWidth={2} />
    </div>
  );
}

function ItemCard({ item, qty, available, onAdd, onRemove }) {
  const cat = CATEGORIES.find((c) => c.id === item.category);
  const atMax = qty >= available;
  const soldOut = available === 0 && qty === 0;
  return (
    <div
      style={{
        background: `linear-gradient(160deg, ${PALETTE.card}, #221a12)`,
        border: `1px solid ${qty > 0 ? PALETTE.gold : PALETTE.cardBorder}`,
        borderRadius: 4,
        padding: "18px 16px 14px",
        position: "relative",
        transition: "border-color 0.3s ease",
        opacity: soldOut ? 0.55 : 1,
      }}
    >
      <div style={{ position: "absolute", top: -16, left: 14 }}>
        {item.imageUrl ? (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              overflow: "hidden",
              border: `1px solid ${qty > 0 ? PALETTE.gold : PALETTE.cardBorder}`,
            }}
          >
            <img src={item.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <Seal Icon={cat?.icon || CATEGORIES[0].icon} active={qty > 0} />
        )}
      </div>

      <div style={{ marginTop: 14, marginBottom: 10 }}>
        <h3 style={{ fontFamily: "Cinzel, serif", fontSize: 16, color: PALETTE.parchment, letterSpacing: 0.3, margin: 0 }}>{item.name}</h3>
        <div style={{ fontFamily: "Spectral, serif", fontSize: 12, color: soldOut ? PALETTE.blood : PALETTE.muted, marginTop: 4 }}>
          {soldOut ? "esgotado nesta data" : `${available} dispon${available === 1 ? "ível" : "íveis"}`}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {(item.tags || []).map((t) => (
          <span
            key={t}
            style={{
              fontFamily: "Spectral, serif",
              fontSize: 11,
              color: PALETTE.muted,
              border: `1px solid ${PALETTE.mutedDark}`,
              borderRadius: 2,
              padding: "2px 7px",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {qty === 0 ? (
          <button
            onClick={() => !soldOut && onAdd(item)}
            disabled={soldOut}
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 12,
              letterSpacing: 0.5,
              color: soldOut ? PALETTE.mutedDark : PALETTE.gold,
              background: "transparent",
              border: `1px solid ${soldOut ? PALETTE.mutedDark : PALETTE.gold}`,
              borderRadius: 2,
              padding: "7px 14px",
              cursor: soldOut ? "not-allowed" : "pointer",
              textTransform: "uppercase",
              width: "100%",
            }}
          >
            {soldOut ? "Esgotado" : "Selar item"}
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <button
              onClick={() => onRemove(item)}
              style={{
                width: 30, height: 30, borderRadius: 2, border: `1px solid ${PALETTE.mutedDark}`,
                background: "transparent", color: PALETTE.parchment, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Minus size={13} />
            </button>
            <span style={{ fontFamily: "Cinzel, serif", color: PALETTE.goldLight, fontSize: 14 }}>{qty}</span>
            <button
              onClick={() => !atMax && onAdd(item)}
              disabled={atMax}
              style={{
                width: 30, height: 30, borderRadius: 2,
                border: `1px solid ${atMax ? PALETTE.mutedDark : PALETTE.gold}`,
                background: "transparent", color: atMax ? PALETTE.mutedDark : PALETTE.gold,
                cursor: atMax ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Plus size={13} />
            </button>
          </div>
        )}
      </div>
      {atMax && qty > 0 && (
        <div style={{ fontFamily: "Spectral, serif", fontSize: 10, color: PALETTE.ember, marginTop: 6, textAlign: "right" }}>
          limite disponível nesta data
        </div>
      )}
    </div>
  );
}

export default function Catalog({ navigate }) {
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState([]);
  const [category, setCategory] = useState("miniatura");
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [list, setList] = useState({}); // itemId -> qty
  const [panelOpen, setPanelOpen] = useState(false);
  const [listCode, setListCode] = useState(null);
  const [meta, setMeta] = useState({ status: "rascunho", mesaCode: null, mesaDate: null });
  const [mesaCodeInput, setMesaCodeInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [otherReservations, setOtherReservations] = useState({});
  const [saving, setSaving] = useState(false);

  // bootstrap: load catalog + resume or create a lista
  useEffect(() => {
    (async () => {
      const items = await listCatalogItems();
      setAllItems(items);

      let code = localStorage.getItem("conjuracao_lista_code");
      if (code) {
        const existingMeta = await getListaMeta(code);
        if (existingMeta) {
          setMeta(existingMeta);
          const itens = await getListaItens(code);
          const asMap = {};
          itens.forEach((i) => (asMap[i.itemId] = i.quantidade));
          setList(asMap);
          if (existingMeta.mesaDate) {
            const res = await getReservasDaData(existingMeta.mesaDate, code);
            setOtherReservations(res);
          }
        } else {
          code = null;
        }
      }
      if (!code) {
        code = genCode();
        await createLista(code);
        localStorage.setItem("conjuracao_lista_code", code);
      }
      setListCode(code);
      setLoading(false);
    })();
  }, []);

  function availableFor(itemId) {
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return 0;
    if (!meta.mesaDate) return item.stock;
    return Math.max(0, item.stock - (otherReservations[itemId] || 0));
  }

  const categoryItems = allItems.filter((i) => i.category === category);
  const allTags = useMemo(() => [...new Set(categoryItems.flatMap((i) => i.tags || []))], [category, allItems]);

  const filtered = categoryItems.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchesTags = activeTags.length === 0 || activeTags.every((t) => (i.tags || []).includes(t));
    return matchesSearch && matchesTags;
  });

  function toggleTag(tag) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function persistList(nextList) {
    if (!listCode) return;
    const itens = Object.entries(nextList).map(([itemId, quantidade]) => ({ itemId, quantidade }));
    setSaving(true);
    try {
      await saveListaItens(listCode, itens);
    } finally {
      setSaving(false);
    }
  }

  function addItem(item) {
    setList((prev) => {
      const current = prev[item.id] || 0;
      if (current >= availableFor(item.id)) return prev;
      const next = { ...prev, [item.id]: current + 1 };
      persistList(next);
      return next;
    });
  }
  function removeItem(item) {
    setList((prev) => {
      const next = { ...prev };
      if (next[item.id] <= 1) delete next[item.id];
      else next[item.id] -= 1;
      persistList(next);
      return next;
    });
  }

  const totalCount = Object.values(list).reduce((a, b) => a + b, 0);
  const listEntries = Object.entries(list)
    .map(([id, qty]) => ({ item: allItems.find((i) => i.id === id), qty }))
    .filter((e) => e.item);
  const conflictEntries = meta.mesaDate ? listEntries.filter((le) => le.qty > availableFor(le.item.id)) : [];

  async function handleLink() {
    if (!dateInput) return;
    await linkListaAMesa(listCode, mesaCodeInput || null, dateInput);
    const res = await getReservasDaData(dateInput, listCode);
    setOtherReservations(res);
    setMeta((m) => ({ ...m, mesaCode: mesaCodeInput || null, mesaDate: dateInput, status: "vinculada" }));
  }

  async function handleConfirm() {
    await confirmarLista(listCode);
    setMeta((m) => ({ ...m, status: "confirmada" }));
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", alignItems: "center", justifyContent: "center", color: PALETTE.muted, fontFamily: "Spectral, serif" }}>
        Abrindo o catálogo...
      </div>
    );
  }

  const linked = !!meta.mesaDate;

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse at top, ${PALETTE.bg2}, ${PALETTE.bg} 60%)`, position: "relative", fontFamily: "Spectral, serif", color: PALETTE.parchment, overflowX: "hidden" }}>
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
        ::placeholder { color: ${PALETTE.mutedDark}; }
        input:focus { outline: none; border-color: ${PALETTE.gold} !important; }
      `}</style>

      <div style={{ position: "relative", height: 170, overflow: "hidden" }}>
        <EmberCanvas />
        <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 16px" }}>
          <button
            onClick={() => navigate("home")}
            style={{ position: "absolute", top: 16, left: 16, background: "none", border: "none", color: PALETTE.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "Spectral, serif", fontSize: 12 }}
          >
            <ArrowLeft size={14} /> selo
          </button>
          <h1 style={{ fontFamily: "Cinzel, serif", fontWeight: 700, fontSize: "clamp(28px, 5vw, 40px)", color: PALETTE.gold, letterSpacing: 2, margin: 0, textShadow: "0 0 24px rgba(205,164,52,0.35)" }}>
            Conjuração
          </h1>
          <p style={{ fontFamily: "Spectral, serif", fontSize: 12, color: PALETTE.muted, marginTop: 6 }}>
            código da sua lista: <strong style={{ color: PALETTE.goldLight }}>{listCode}</strong>
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 120px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setCategory(c.id); setActiveTags([]); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, fontFamily: "Cinzel, serif", fontSize: 12,
                  letterSpacing: 0.5, textTransform: "uppercase", color: active ? "#1a1208" : PALETTE.parchment,
                  background: active ? PALETTE.gold : "transparent", border: `1px solid ${active ? PALETTE.gold : PALETTE.cardBorder}`,
                  borderRadius: 2, padding: "9px 16px", cursor: "pointer",
                }}
              >
                <Icon size={14} /> {c.label}
              </button>
            );
          })}
        </div>

        <div style={{ position: "relative", marginBottom: 18 }}>
          <Search size={15} color={PALETTE.mutedDark} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar no catálogo..."
            style={{ width: "100%", background: PALETTE.card, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, padding: "11px 14px 11px 38px", color: PALETTE.parchment, fontFamily: "Spectral, serif", fontSize: 14 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 26 }}>
          {allTags.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button key={tag} onClick={() => toggleTag(tag)} style={{ fontFamily: "Spectral, serif", fontSize: 12, color: active ? "#1a1208" : PALETTE.muted, background: active ? PALETTE.goldLight : "transparent", border: `1px solid ${active ? PALETTE.goldLight : PALETTE.mutedDark}`, borderRadius: 12, padding: "4px 12px", cursor: "pointer" }}>
                {tag}
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "22px 16px" }}>
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} qty={list[item.id] || 0} available={availableFor(item.id)} onAdd={addItem} onRemove={removeItem} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: PALETTE.muted, fontFamily: "Spectral, serif" }}>
            {allItems.length === 0 ? "Catálogo ainda vazio. Peça ao admin pra cadastrar os itens." : "Nenhum item encontrado com esses filtros."}
          </div>
        )}
      </div>

      {totalCount > 0 && !panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          style={{ position: "fixed", bottom: 24, right: 24, display: "flex", alignItems: "center", gap: 10, background: `linear-gradient(135deg, ${PALETTE.gold}, ${PALETTE.ember})`, color: "#1a1208", border: "none", borderRadius: 30, padding: "13px 20px", fontFamily: "Cinzel, serif", fontSize: 13, letterSpacing: 0.5, cursor: "pointer", boxShadow: "0 4px 18px rgba(194,104,42,0.45)", zIndex: 10 }}
        >
          <ScrollText size={16} /> Lista de Conjuração ({totalCount})
        </button>
      )}

      {panelOpen && (
        <>
          <div onClick={() => setPanelOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(10,8,6,0.6)", backdropFilter: "blur(2px)", zIndex: 20 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(380px, 100vw)", background: PALETTE.bg2, borderLeft: `1px solid ${PALETTE.cardBorder}`, zIndex: 21, display: "flex", flexDirection: "column", padding: 20, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <h2 style={{ fontFamily: "Cinzel, serif", color: PALETTE.gold, fontSize: 18, margin: 0 }}>Sua Conjuração</h2>
                <span style={{ fontFamily: "Spectral, serif", fontSize: 11, color: PALETTE.muted, letterSpacing: 1 }}>código {listCode} {saving && "· salvando..."}</span>
              </div>
              <button onClick={() => setPanelOpen(false)} style={{ background: "none", border: "none", color: PALETTE.muted, cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginTop: 18, marginBottom: 18, padding: 14, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 4, background: PALETTE.card }}>
              {!linked ? (
                <>
                  <div style={{ fontFamily: "Spectral, serif", fontSize: 12, color: PALETTE.muted, marginBottom: 8 }}>
                    Já sabe a data da sua mesa? Vincule pra travar a disponibilidade e ver se há conflito.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      value={mesaCodeInput}
                      onChange={(e) => setMesaCodeInput(e.target.value.toUpperCase().slice(0, 4))}
                      placeholder="Código da mesa (opcional)"
                      style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, padding: "8px 10px", color: PALETTE.parchment, fontFamily: "Spectral, serif", fontSize: 12 }}
                    />
                    <input
                      type="date"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.cardBorder}`, borderRadius: 2, padding: "8px 10px", color: PALETTE.parchment, fontFamily: "Spectral, serif", fontSize: 12 }}
                    />
                    <button
                      onClick={handleLink}
                      disabled={!dateInput}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "Cinzel, serif", fontSize: 11, letterSpacing: 0.5, color: dateInput ? "#1a1208" : PALETTE.mutedDark, background: dateInput ? PALETTE.gold : "transparent", border: `1px solid ${dateInput ? PALETTE.gold : PALETTE.mutedDark}`, borderRadius: 2, padding: "9px 14px", cursor: dateInput ? "pointer" : "not-allowed", textTransform: "uppercase" }}
                    >
                      <Link2 size={13} /> Vincular data
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Spectral, serif", fontSize: 13, color: PALETTE.goldLight }}>
                    <Check size={15} /> Vinculada
                    {meta.mesaCode ? ` à mesa ${meta.mesaCode}` : ""}
                  </div>
                  <div style={{ fontFamily: "Spectral, serif", fontSize: 12, color: PALETTE.muted, marginTop: 4, marginLeft: 23 }}>
                    {new Date(meta.mesaDate + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                  </div>
                </div>
              )}
            </div>

            {conflictEntries.length > 0 && (
              <div style={{ marginBottom: 14, padding: "12px 14px", border: `1px solid ${PALETTE.blood}`, borderRadius: 4, background: "rgba(122,36,32,0.12)" }}>
                <div style={{ fontFamily: "Cinzel, serif", fontSize: 12, color: "#e2897f", marginBottom: 4, letterSpacing: 0.3 }}>Conflito de disponibilidade</div>
                <div style={{ fontFamily: "Spectral, serif", fontSize: 12, color: PALETTE.muted }}>
                  Outra mesa já reservou parte deste material pra essa data. Ajuste a quantidade dos itens marcados abaixo antes de confirmar.
                </div>
              </div>
            )}

            {listEntries.length === 0 ? (
              <div style={{ color: PALETTE.muted, fontFamily: "Spectral, serif", fontSize: 13, textAlign: "center", marginTop: 30 }}>
                Sua lista está vazia. Sele itens no catálogo.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {listEntries.map(({ item, qty }) => {
                  const avail = availableFor(item.id);
                  const inConflict = linked && qty > avail;
                  return (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", border: `1px solid ${inConflict ? PALETTE.blood : PALETTE.cardBorder}`, borderRadius: 3 }}>
                      <div>
                        <div style={{ fontFamily: "Spectral, serif", fontSize: 13, color: PALETTE.parchment }}>{item.name}</div>
                        <div style={{ fontFamily: "Spectral, serif", fontSize: 11, color: inConflict ? "#e2897f" : PALETTE.muted }}>
                          {inConflict ? `só ${avail} dispon${avail === 1 ? "ível" : "íveis"} nesta data` : CATEGORIES.find((c) => c.id === item.category)?.label}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => removeItem(item)} style={{ background: "none", border: "none", color: PALETTE.muted, cursor: "pointer" }}>
                          <Minus size={14} />
                        </button>
                        <span style={{ fontFamily: "Cinzel, serif", color: inConflict ? "#e2897f" : PALETTE.goldLight, fontSize: 13 }}>{qty}</span>
                        <button onClick={() => qty < avail && addItem(item)} style={{ background: "none", border: "none", color: PALETTE.muted, cursor: "pointer" }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {listEntries.length > 0 && (
              <button
                onClick={handleConfirm}
                disabled={conflictEntries.length > 0}
                style={{ marginTop: 24, fontFamily: "Cinzel, serif", fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase", color: conflictEntries.length > 0 ? PALETTE.mutedDark : "#1a1208", background: conflictEntries.length > 0 ? "transparent" : `linear-gradient(135deg, ${PALETTE.gold}, ${PALETTE.ember})`, border: conflictEntries.length > 0 ? `1px solid ${PALETTE.cardBorder}` : "none", borderRadius: 2, padding: "12px", cursor: conflictEntries.length > 0 ? "not-allowed" : "pointer" }}
              >
                {meta.status === "confirmada" ? "Conjuração confirmada ✓" : conflictEntries.length > 0 ? "Resolva os conflitos para confirmar" : "Confirmar conjuração"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
