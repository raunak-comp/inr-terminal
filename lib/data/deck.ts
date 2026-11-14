// Deck snapshot data. Figures are taken exactly from the team's final deck
// (The Black Swans · MacroMinds 3.0). Do not edit values here without the team.

export const SNAPSHOT_DATE = "2026-11-10";

export const ticker = {
  usdinr: 93.8, brent: 113.2, us10y: 5.2, in10y: 7.17, dollarIndex: 102,
  repo: 5.50, sdf: 5.25, msf: 5.75, callRate: 5.69, reservesB: 734.6,
  cpi: 5.54, wpi: 11.4, fwdPremium1M: 7.62, reer: 92.2, fedFunds: "3.75–4.00",
};

export type Anchor = { date: string; value: number; label?: string };

export const rupeeAnchors: Anchor[] = [ // snapshot fallback: anchor points only, label as "anchor points, not daily data"
  { date: "2025-04-01", value: 87.0, label: "FY26 start" },
  { date: "2026-05-15", value: 96.96, label: "Record low (May 2026)" },
  { date: "2026-10-29", value: 95.26, label: "Pre-midterms" },
  { date: "2026-11-10", value: 93.8, label: "Post-midterms rebound" },
];

export const events = [
  { date: "2026-03-02", label: "Hormuz shut" },
  { date: "2026-05-15", label: "Record low ₹96.96" },
  { date: "2026-07-01", label: "Ceasefire" },
  { date: "2026-09-15", label: "Fed hikes to 3.75–4.00%" },
  { date: "2026-10-07", label: "RBI hike: repo 5.50%" },
  { date: "2026-10-22", label: "Bank liquidity ~₹0" },
  { date: "2026-11-06", label: "US midterms: $4B FPI inflow in a week" },
];

export const brent2026: Anchor[] = [
  { date: "2026-02-20", value: 72.9 }, { date: "2026-03-31", value: 118.4, label: "Peak" },
  { date: "2026-07-01", value: 71.6, label: "Ceasefire" }, { date: "2026-10-15", value: 113.2, label: "Re-escalation" },
];

export const reservesWeekly: [string, number][] = [ // $B, week ending
  ["2026-02-20", 723.0], ["2026-02-27", 728.5], ["2026-03-27", 691.1], ["2026-05-01", 690.7],
  ["2026-08-07", 707.0], ["2026-08-28", 740.8], ["2026-09-04", 785.7], ["2026-09-25", 747.6], ["2026-10-02", 734.6],
];

export const fpiMonthly: [string, number][] = [ // $B net equity flow
  ["Apr", 1.2], ["May", -2.4], ["Jun", -1.8], ["Jul", 0.5], ["Aug", -3.1], ["Sep", -4.8],
  ["Oct", -8.2], ["Nov", -4.5], ["Dec", -3.2], ["Jan", -2.1], ["Feb", -1.9],
];
export const fpiKpis = { outflowMonths: "7 of 10", marchRecord: "₹1.18L Cr", nov2to9Inflow: "₹53.7K Cr", in10y: "7.48% → 7.17%" };

export const liquidity: [string, number][] = [ // ₹ lakh crore
  ["Feb–Mar", 2.5], ["23 Mar", -0.7], ["7 Sep", 11.6], ["22 Oct", 0], ["6 Nov", 2.3],
];

export const rbiDefence = { netSpotSalesFY26B: 53, forwardShortBookB: 103, grossSalesFY26B: 195, reserveDrainB: 51, rupeesPerBillionCr: 9400 };

export const importBasketFY26: [string, number][] = [["Crude oil", 25], ["Electronics/Semiconductors", 15], ["Gold", 10], ["Others", 50]];
export const outflowDriversQ1FY27 = {
  totalB: 15.2,
  split: [["FPI equity flight", 50], ["Income repatriation", 25], ["ECB debt servicing", 15], ["LRS outward remittances", 10]] as [string, number][],
};

export const twinDeficits = [ // combined fiscal deficit % GDP, CAD $B
  { fy: "FY23", fiscal: 9.2, cadB: -67 }, { fy: "FY24", fiscal: 8.6, cadB: -23 }, { fy: "FY25", fiscal: 7.8, cadB: -31 },
  { fy: "FY26", fiscal: 7.4, cadB: -42 }, { fy: "FY27E", fiscal: 7.5, cadB: -48 },
];

export const headline = {
  recordLow: 96.96, recordLowWhen: "May 2026", tradeGapB: -333.2, combinedFiscal: 7.4, cadPctGDP: 0.6,
  spreadBps: 251, savingsVsInvestment: "30.4% vs 32.8%", interestBill: "₹14.04L Cr (26.3% of budget)",
  crudeReliance: 88, q1OilBillB: 60.6, oilBillYoYB: 11.4, goldBillB: 72, goldTonnes: "757T → 721T",
  fpiEquityExit: "₹3.08T (Jan–Sep) / ₹3.64T (to 12 Oct)", foreignStake: "14.7% (14-year low)", asiaWorstCY26: -7,
  netCapitalOutflowQ1B: 15.2, bopB: -8.13, primaryIncomeB: -10.5, capitalShockB: -32.7,
  externalDebtB: 778, stDebtPctReserves: 23, oneYearDuesPctReserves: 50.5, reservesToDebt: "91% → 86%",
};

export const corporate = {
  ecbTotalB: 255, ecbUnhedgedB: 87, unhedgedPct: 34, fwdPremiumPath: [5.58, 7.62], refinancingCliffB: 120, cliffDate: "2028-03-31",
  techImportB: ">100", passThrough: "10% depreciation adds 30–40 bps to CPI", cpi: 5.54, ruralFood: 8.06,
  liquidityChain: ["₹11.6L Cr surplus (7 Sep)", "FX & VRRR drain ~₹11L Cr in six weeks", "~₹0 (22 Oct)", "Call 5.69% vs 5.50% repo", "Rebuilt to ₹2.3L Cr (6 Nov)"],
  fundingStress: ["5.69% call rate on 22 Oct, 6 bps below the 5.75% MSF", "Bank short-term funding costs up to 0.5% in one week", "₹2L Cr lent by RBI in one week", "₹3–4L Cr pulled out of banks by RBI dollar sales"],
  cdRates: "+40–50 bps in a single week", surplusFall: "96% in six weeks",
};

export const inflationSplit: [string, number][] = [["Food", 7.74], ["Villages", 6.08], ["Cities", 4.88]]; // Sep 2026

export const idealRupee = {
  ideal: [85, 88], today: 94, reerEquilibrium: "98–100", gap: "8% (REER)",
  zones: [ { from: 100, to: 94.3, label: "Too weak" }, { from: 94.3, to: 88, label: "Risky" }, { from: 88, to: 85, label: "IDEAL" },
           { from: 85, to: 80, label: "Risky" }, { from: 80, to: 75, label: "Too strong" } ],
  comparison: {
    columns: ["₹75–80", "₹85–88", "₹94–100"],
    rows: [ ["Petrol & imports", "Cheapest", "Manageable", "Costliest"], ["Exports & jobs", "Orders lost", "Competitive", "Tariff-capped"],
            ["Family prices", "Lowest", "Stable", "Up sharply"], ["RBI's dollars", "Burnt to hold it", "Rebuilt ($750B+)", "Drained (−$51B)"],
            ["Verdict", "Overvalued: REER 108–115", "True equilibrium", "Undervalued: REER 87–92"] ],
  },
  road: ["Bring FPI back: 2–3 yr tax lock-in", "Smooth spikes: sell $ only to calm panic", "Cool inflation: hold 5.50% repo; cut CPI to 4%", "Shrink $ bills: ethanol, gold bonds, trade in ₹"],
  result: "₹ strengthens from ₹94.26 to ₹85–88 as flows return & oil cools",
};

export const scorecard = { // 0–3 per criterion: Calms the ₹, Saves dollars, Guards growth, Curbs prices, Easy to do
  criteria: ["Calms the ₹", "Saves dollars", "Guards growth", "Curbs prices", "Easy to do"],
  options: [
    { name: "Big dollar sales", s: [3,1,2,2,2], total: 10, cost: "$51B of reserves gone in one month" },
    { name: "Sharp rate hikes", s: [2,3,1,2,2], total: 10, cost: "Growth forecasts cut to 6.0–6.9%" },
    { name: "FX curbs & controls", s: [2,3,2,1,2], total: 10, cost: "Hedging costs jumped to 7.62%" },
    { name: "Gold import curbs", s: [1,2,2,1,1], total: 7, cost: "Smuggling rose 35% after past hikes" },
    { name: "Free float", s: [1,3,3,1,3], total: 11, cost: "Prices up; unhedged firms hurt" },
    { name: "Our blend", s: [3,2,3,2,2], total: 12, cost: "Needs RBI–Govt discipline", ours: true },
  ] as { name: string; s: number[]; total: number; cost: string; ours?: boolean }[],
};

export const playbook = [
  { p: 1, when: "Now · 0–3 months", who: "RBI", title: "Smooth, don't steer", what: "Cap sharp daily swings, not the level; hike only if core prices rise.", why: "Saves reserves for real shocks" },
  { p: 2, when: "3–12 months", who: "RBI", title: "Exit emergency curbs", what: "Phase out FERR, the $5M limit and the NDF ban on a published timetable.", why: "Hedging costs hit 7.62%" },
  { p: 3, when: "3–12 months", who: "Govt", title: "Fund the gap smartly", what: "Tax breaks for 2–3 year foreign investors; stick to the fiscal glide.", why: "$4B came back in one week" },
  { p: 4, when: "1–3 years", who: "Govt + RBI", title: "Shrink the dollar bills", what: "Fill oil reserves, unlock household gold and grow trade invoiced in rupees.", why: "The only lasting fix to the gap" },
];

export const roadmap = [ // start/end in months from now
  { pr: "P1", action: "Smooth swings, no ₹ target", owner: "RBI · ongoing", start: 0, end: 36, target: "Orderly ₹ market" },
  { pr: "P1", action: "Publish usable reserves", owner: "RBI", start: 0, end: 3, target: "Monthly disclosure" },
  { pr: "P2", action: "Exit emergency FX curbs", owner: "RBI · fixed timetable", start: 3, end: 12, target: "Premium below 5.6%" },
  { pr: "P3", action: "Tax relief for long-stay FPIs", owner: "Govt · 2–3 year lock-in", start: 3, end: 18, target: "FPI stake above 15%" },
  { pr: "P3", action: "Hold the fiscal glide path", owner: "Govt · lower borrowing", start: 6, end: 36, target: "Deficit below 4%" },
  { pr: "P4", action: "Build oil stocks & ₹ trade", owner: "Govt + RBI · reserve Phase II", start: 6, end: 36, target: "22-day oil buffer" },
];

export const tripwires = [
  { name: "Oil shock returns", severity: "HIGH", watch: "Brent above $120 for two weeks", act: "Reopen oil-firm dollar window; draw oil stocks" },
  { name: "Fed hikes again on 9 Dec", severity: "LIKELY", watch: "~78% odds; US 10-year back above 5%", act: "Follow only if core inflation keeps rising" },
  { name: "Hidden forward book", severity: "HIGH", watch: "~$200B owed shrinks usable reserves", act: "Let forwards expire slowly; keep FCNR buffer" },
  { name: "Food-led stagflation", severity: "MEDIUM", watch: "CPI above 6%, led by food prices", act: "Supply steps first, not more rate hikes" },
];

export const answer = [
  { title: "₹100 ≠ Crisis", text: "An outside shock hit a sound economy: CAD is 0.6% of GDP, not 4.8% as in 2013" },
  { title: "Pace is the risk", text: "Fast, messy falls lift prices and hit unhedged firms" },
  { title: "Fix the flows", text: "Cut oil and gold bills and make foreign money stay longer" },
];
export const limits = ["Plan fails if the CAD tops 2.5% of GDP and outflows stay above $40B a year", "Reserve-use data are estimates", "Assumes oil settles below $110", "Fiscal fixes need State buy-in", "Political push to defend ₹100"];

export const sources = [ // show in Sources screen; add URLs where known
  "RBI: BoP press release Q1 FY27; MPC October 2026 resolution; Annual Report 2025-26",
  "PIB / MoSPI: CPI September 2026", "Livemint: Union Budget 2026-27; Malhotra on the rupee (7 Oct)",
  "Reuters: Governor on reserves (8 Apr 2026)", "Chartforest (RBI data): External debt, June 2026",
  "BBC: US-India trade deal", "CNBC: Curbs on dollar demand (10 Oct); forward book (16 Oct, Ambit)",
  "Business Standard: Record FPI outflows (13 Oct); Rajan on reserves (27 Oct); Economic Survey 2026",
  "BusinessToday: Rupee after US midterms (10 Nov)", "ETBFSI: RBI's record FY26 defence", "BusinessLine: Spot and forward dollar sales",
  "Indian Express: FCNR(B) swap window", "Moody's via TradingView: forward premiums", "MUFG via FXStreet: FX curbs and hedging",
  "India Today: gold curbs", "ANI / ICICI: liquidity and bond yields (10 Nov)", "Rediff: How RBI fights the rupee fall",
  "Bank of Baroda: imported inflation (2025)", "IGIDR WP-2022-012", "Bhat (2022), IJFE", "Urbanomics: external exposure",
  "Finnovate: FY26 trade data; NOP cap and NDF ban", "Wright Research: cost of defending the rupee", "PolicyCircle: strategic oil reserves",
  "Icra via IPA: oil-firm losses", "CNBC-TV18: hike or protect growth?", "OneTradeJournal: 2013 taper-tantrum data",
  "Live feeds: ECB reference rates via Frankfurter; FRED (St. Louis Fed)",
];
