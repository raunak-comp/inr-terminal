// Stress model baseline and coefficients. Every coefficient is editable in the
// Sources & Assumptions screen; edits re-run the Stress Engine instantly.

export const BASELINE = {
  USDINR0: 93.8,
  BRENT0: 113.2,
  CPI0: 5.54,
  CAD0: 0.6, // % of GDP
  RES0: 734.6, // $B
  LIQ0: 2.3, // ₹ lakh crore surplus
  REPO0: 5.5,
  SDF0: 5.25,
  MSF0: 5.75,
  FWDPREM_NO_CURBS: 5.58,
  CURBS_PREMIUM_ADD: 2.04, // curbs-ON premium = 7.62
  UNHEDGED_ECB: 87, // $B
  ACTUAL_CALL: 5.69, // 22 Oct 2026
} as const;

export type CoefKey =
  | "OIL_BILL_PER_10" | "CAD_PER_10" | "FED_FPI_PER_25" | "REPO_FPI_PER_25" | "DEPR_PER_1B" | "APPR_PER_1B"
  | "CURBS_DAMPING" | "PASS_THROUGH" | "FUEL_DIRECT_PER_10" | "LIQ_DRAIN_PER_1B" | "MONTHLY_IMPORTS"
  | "FWD_PREM_PER_1PCT" | "VOL_ANNUAL" | "CALL_BASE" | "CALL_LIQ_SENS";

export type Coefficients = Record<CoefKey, number>;

export type CoefMeta = { key: CoefKey; label: string; unit: string; tag: "Deck" | "Team assumption" | "Deck-calibrated"; note: string; step: number };

export const DEFAULT_COEFFICIENTS: Coefficients = {
  OIL_BILL_PER_10: 15,
  CAD_PER_10: 1.1,
  FED_FPI_PER_25: -3,
  REPO_FPI_PER_25: 1.5,
  DEPR_PER_1B: 0.2,
  APPR_PER_1B: 0.15,
  CURBS_DAMPING: 0.2,
  PASS_THROUGH: 0.035,
  FUEL_DIRECT_PER_10: 0.15,
  LIQ_DRAIN_PER_1B: 0.094,
  MONTHLY_IMPORTS: 86,
  FWD_PREM_PER_1PCT: 0.1,
  VOL_ANNUAL: 6,
  CALL_BASE: 5.6,
  CALL_LIQ_SENS: 0.1,
};

export const COEF_META: CoefMeta[] = [
  { key: "OIL_BILL_PER_10", label: "Oil bill per +$10 Brent", unit: "$B / yr", tag: "Team assumption", note: "Extra annual import bill for every $10 rise in Brent", step: 0.5 },
  { key: "CAD_PER_10", label: "CAD per +$10 Brent", unit: "pp of GDP", tag: "Deck-calibrated", note: "Calibrated so Brent $130 gives a CAD of ~2.5% (deck risk: Brent $130+ → CAD 2.5–3%)", step: 0.05 },
  { key: "FED_FPI_PER_25", label: "FPI flow per +25 bps US shock", unit: "$B / qtr", tag: "Team assumption", note: "Foreign portfolio money that leaves when US yields rise", step: 0.5 },
  { key: "REPO_FPI_PER_25", label: "FPI flow per +25 bps repo", unit: "$B / qtr", tag: "Team assumption", note: "Deliberately weak: a 251 bps spread did not stop outflows", step: 0.25 },
  { key: "DEPR_PER_1B", label: "Rupee fall per $1B unabsorbed outflow", unit: "% per $B", tag: "Team assumption", note: "How far the rupee moves for each $1B the market must absorb", step: 0.01 },
  { key: "APPR_PER_1B", label: "Rupee rise per $1B unabsorbed inflow", unit: "% per $B", tag: "Team assumption", note: "Smaller than the fall coefficient: rallies are slower", step: 0.01 },
  { key: "CURBS_DAMPING", label: "Damping from emergency FX curbs", unit: "share", tag: "Team assumption", note: "Curbs cut the rupee move by this share, at the cost of a higher forward premium", step: 0.05 },
  { key: "PASS_THROUGH", label: "CPI pass-through per 1% fall", unit: "pp", tag: "Deck", note: "A 10% depreciation adds 30–40 bps to CPI", step: 0.005 },
  { key: "FUEL_DIRECT_PER_10", label: "Direct fuel effect per +$10 Brent", unit: "CPI pp", tag: "Team assumption", note: "Fuel and transport prices feeding CPI directly", step: 0.01 },
  { key: "LIQ_DRAIN_PER_1B", label: "Liquidity drain per $1B RBI sale", unit: "₹L Cr", tag: "Deck", note: "~₹9,400 Cr drained for every $1B the RBI sells", step: 0.002 },
  { key: "MONTHLY_IMPORTS", label: "Monthly imports for cover", unit: "$B", tag: "Deck-calibrated", note: "Calibrated to the deck's 6.2-month net cover", step: 1 },
  { key: "FWD_PREM_PER_1PCT", label: "Forward premium per 1% fall", unit: "pp", tag: "Team assumption", note: "Hedging gets dearer as the rupee falls", step: 0.01 },
  { key: "VOL_ANNUAL", label: "USD/INR annual volatility", unit: "%", tag: "Team assumption", note: "Used by the Monte Carlo fan chart; ×1.5 when the Crisis Meter is above 60", step: 0.5 },
  { key: "CALL_BASE", label: "Call rate anchor", unit: "%", tag: "Team assumption", note: "Call rate when the liquidity surplus is zero, before repo changes", step: 0.01 },
  { key: "CALL_LIQ_SENS", label: "Call rate fall per ₹1L Cr surplus", unit: "pp", tag: "Team assumption", note: "More surplus pushes the call rate towards the SDF floor", step: 0.01 },
];
