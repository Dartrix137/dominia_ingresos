// Shared constants for the DOMINIA 1.0 event

export const EVENT_CONFIG = {
  // Header text (top of PDF)
  welcomeText: "WELCOME TO",
  brandMark: "LSD",
  brandSub: "La Sucursal Digital",

  // Footer (bottom of PDF)
  footer: "DOMINIA 1.0 | Teatro San Fernando | Cali 05 agosto",

  // Section labels (pill labels in green)
  labelIdentity: "Numero de Identidad",
  labelLocality: "Localidad",
  labelAccess: "QR DE ACCESO",

  // Locales
  localities: ["VIP", "General Baja", "General Alta"] as const,
};

export type Locality = (typeof EVENT_CONFIG.localities)[number];

// Staff PIN — change before production
export const STAFF_PIN = "4729";

// Cookie name for staff session
export const SESSION_COOKIE = "dominia_staff_session";

// Session validity (in ms) — 12 hours
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
