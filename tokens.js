import { Swords, Box, Mountain } from "lucide-react";

export const PALETTE = {
  bg: "#0f0c09",
  bg2: "#1a140e",
  card: "#1c1610",
  cardBorder: "#3a2e1d",
  gold: "#cda434",
  goldLight: "#e8c468",
  ember: "#c2682a",
  blood: "#7a2420",
  parchment: "#e9dfc8",
  muted: "#9c8c6f",
  mutedDark: "#564a37",
};

export const CATEGORIES = [
  { id: "miniatura", label: "Miniaturas", icon: Swords },
  { id: "objeto", label: "Objetos", icon: Box },
  { id: "terreno", label: "Terrenos", icon: Mountain },
];

export const UNIT_TYPES = [
  { id: "individual", label: "Individual" },
  { id: "pack", label: "Pack" },
];

export const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Spectral:wght@300;400;500&display=swap');";

