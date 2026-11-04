export const TYPE_LABELS = {
  industri: "Industri",
  handel: "Handel",
  kontor: "Kontor",
};

export const EMPTY_LISTING_TEXT =
  "Just nu har vi inga lediga lokaler – hör gärna av dig ändå.";

export function typeLabel(type) {
  if (typeof type !== "string") return "";
  const key = type.trim().toLowerCase();
  return TYPE_LABELS[key] || oneLine(type);
}

export function formatArea(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "";
  const formatted = new Intl.NumberFormat("sv-SE", {
    maximumFractionDigits: 1,
  }).format(value);
  return `${formatted} m²`;
}

export function safeId(value, index) {
  const raw = String(value ?? `objekt-${index + 1}`).toLowerCase();
  const cleaned = raw.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || `objekt-${index + 1}`;
}

export function safeImage(value) {
  if (typeof value !== "string") return "";
  const src = value.trim();
  if (!src || src.includes("..") || src.includes("\\")) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith("//") || src.startsWith("/")) {
    return "";
  }
  if (!/^[\w./-]+$/.test(src)) return "";
  return src;
}

export function selectListings(data, { drafts = false } = {}) {
  if (!data || !Array.isArray(data.objekt)) {
    throw new Error("Fel format i data/lediga.json");
  }
  return data.objekt
    .map((item, index) => normalizeListing(item, index))
    .filter((item) => (drafts ? true : item.published));
}

function normalizeListing(item, index) {
  const source = item && typeof item === "object" ? item : {};
  const published = source.published === true;
  const type = typeof source.type === "string" ? source.type.trim().toLowerCase() : "";
  return {
    id: safeId(source.id, index),
    published,
    draft: !published,
    title: oneLine(source.title) || "Lokal utan rubrik",
    type,
    typeLabel: typeLabel(type),
    address: oneLine(source.address),
    area: formatArea(source.areaSqm),
    description: plain(source.description).slice(0, 5000),
    images: Array.isArray(source.images) ? source.images.map(safeImage).filter(Boolean) : [],
    access: oneLine(source.access),
    rent: oneLine(source.rent),
  };
}

function plain(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim();
}

function oneLine(value) {
  return plain(value).replace(/\s+/g, " ").trim();
}
