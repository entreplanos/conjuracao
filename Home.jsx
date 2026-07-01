import { useState } from "react";
import { KeyRound } from "lucide-react";
import { PALETTE, FONT_IMPORT } from "./tokens.js";
import EmberCanvas from "./EmberCanvas.jsx";

function pt(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}
function arcPath(cx, cy, r, startDeg, endDeg) {
  const s = pt(cx, cy, r, startDeg);
  const e = pt(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function MagicSeal({ onEnter, entering }) {
  const [hover, setHover] = useState(false);
  const cx = 100, cy = 100;

  const outerRight = arcPath(cx, cy, 92, 16, 164);
  const outerLeft = arcPath(cx, cy, 92, 196, 344);
  const innerRight = arcPath(cx, cy, 82, 12, 168);
  const innerLeft = arcPath(cx, cy, 82, 192, 348);

  return (
    <button
      onClick={onEnter}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Entrar na Conjuração"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        width: 280,
        height: 280,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
        transform: entering ? "scale(1.18)" : hover ? "scale(1.045)" : "scale(1)",
        opacity: entering ? 0 : 1,
        filter: entering ? "brightness(2)" : "none",
      }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        style={{
          filter: hover
            ? `drop-shadow(0 0 22px rgba(205,164,52,0.65)) drop-shadow(0 0 46px rgba(194,104,42,0.35))`
            : `drop-shadow(0 0 10px rgba(205,164,52,0.35))`,
          transition: "filter 0.4s ease",
        }}
      >
        <g style={{ transformOrigin: "100px 100px", animation: "seal-rotate 90s linear infinite" }}>
          <path d={outerRight} fill="none" stroke={PALETTE.gold} strokeWidth="1.4" />
          <path d={outerLeft} fill="none" stroke={PALETTE.gold} strokeWidth="1.4" />
        </g>
        <g style={{ transformOrigin: "100px 100px", animation: "seal-rotate-rev 70s linear infinite" }}>
          <path d={innerRight} fill="none" stroke={PALETTE.goldLight} strokeWidth="0.9" opacity="0.8" />
          <path d={innerLeft} fill="none" stroke={PALETTE.goldLight} strokeWidth="0.9" opacity="0.8" />
        </g>

        {/* icosaedro, dividido pelo portal */}
        <g stroke={PALETTE.parchment} strokeWidth="1.1" fill="none" opacity="0.9">
          <polygon points="100,62 134,82 134,118 100,138 66,118 66,82" />
          <line x1="100" y1="62" x2="134" y2="118" />
          <line x1="100" y1="62" x2="66" y2="118" />
          <line x1="100" y1="138" x2="134" y2="82" />
          <line x1="100" y1="138" x2="66" y2="82" />
          <line x1="66" y1="82" x2="134" y2="82" />
          <line x1="66" y1="118" x2="134" y2="118" />
        </g>

        {/* portal */}
        <g stroke={PALETTE.goldLight} strokeWidth="1.2" fill={PALETTE.goldLight}>
          <line x1="100" y1="18" x2="100" y2="182" opacity="0.85" />
          <path d="M 100 30 L 104 44 L 100 58 L 96 44 Z" opacity="0.9" />
          <path d="M 100 142 L 104 156 L 100 170 L 96 156 Z" opacity="0.9" />
          <circle cx="90" cy="40" r="1.3" />
          <circle cx="110" cy="46" r="1.1" />
          <circle cx="90" cy="160" r="1.3" />
          <circle cx="110" cy="154" r="1.1" />
        </g>
      </svg>
    </button>
  );
}

export default function Home({ navigate }) {
  const [entering, setEntering] = useState(false);

  function handleEnter() {
    setEntering(true);
    setTimeout(() => navigate("catalogo"), 480);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse at 50% 40%, ${PALETTE.bg2}, ${PALETTE.bg} 65%)`,
        position: "relative",
        fontFamily: "Spectral, serif",
        color: PALETTE.parchment,
        overflow: "hidden",
      }}
    >
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
        @keyframes seal-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes seal-rotate-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      `}</style>

      <EmberCanvas />

      <button
        onClick={() => navigate("admin")}
        aria-label="Acesso do administrador"
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 15,
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: `1px solid ${PALETTE.cardBorder}`,
          color: PALETTE.muted,
          cursor: "pointer",
        }}
      >
        <KeyRound size={17} />
      </button>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <span style={{ fontFamily: "Spectral, serif", fontSize: 11, letterSpacing: 4, color: PALETTE.muted, textTransform: "uppercase", marginBottom: 6 }}>
          Entre Planos
        </span>

        <MagicSeal onEnter={handleEnter} entering={entering} />

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontWeight: 700,
            fontSize: "clamp(28px, 5vw, 40px)",
            color: PALETTE.gold,
            letterSpacing: 2,
            margin: "10px 0 0",
            textShadow: "0 0 24px rgba(205,164,52,0.3)",
          }}
        >
          Conjuração
        </h1>
        <p style={{ fontFamily: "Spectral, serif", fontSize: 13, color: PALETTE.muted, marginTop: 10, textAlign: "center" }}>
          Toque no selo para separar o material da sua próxima sessão.
        </p>
      </div>
    </div>
  );
}
