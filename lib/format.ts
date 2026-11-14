// Single source of number formatting. Real minus sign (U+2212) everywhere.
export const MINUS = "\u2212";

const fix = (v: number, d: number) => {
  const s = Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
  return (v < 0 && Number(Math.abs(v).toFixed(d)) !== 0 ? MINUS : "") + s;
};

export const num = (v: number, d = 2) => fix(v, d);
/** Signed delta: +0.25 / −0.40 */
export const signed = (v: number, d = 2) => {
  const r = Number(v.toFixed(d));
  if (r === 0) return (0).toFixed(d);
  return (r > 0 ? "+" : MINUS) + Math.abs(r).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
};
export const inr = (v: number, d = 2) => `₹${fix(v, d)}`;
export const usdB = (v: number, d = 1) => (v < 0 ? `${MINUS}$${fix(-v, d)}B` : `$${fix(v, d)}B`);
export const signedUsdB = (v: number, d = 1) => (Number(v.toFixed(d)) === 0 ? `$0.0B` : `${v > 0 ? "+" : MINUS}$${fix(Math.abs(v), d)}B`);
export const pct = (v: number, d = 2) => `${fix(v, d)}%`;
export const share = (v: number) => `${fix(v, 1)}%`;
export const bps = (v: number) => `${signed(Math.round(v), 0)} bps`;
/** ₹ lakh crore */
export const lakhCr = (v: number, d = 2) => `₹${fix(v, d)}L Cr`;
/** ₹ crore with en-IN grouping */
export const crore = (v: number) => `₹${fix(v, 0)} Cr`;

export const shortDate = (iso: string) => {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};
export const dayMonth = (iso: string) => {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
};
