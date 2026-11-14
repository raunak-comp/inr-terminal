// Supporting reference data: team assessments, data catalogue and labels.
// Everything here is either derived from deck.ts or clearly tagged as a team assessment.
import { corporate, fpiKpis, headline, rbiDefence, SNAPSHOT_DATE, ticker } from "./deck";

/** Qualitative 1–5 exposure scores. Tagged "Team assessment" in the UI. */
export const sectorExposure = {
  columns: ["FX debt", "Import cost", "Hedging cost", "Revenue in $"],
  /** true = higher score is a cushion (a weaker rupee helps) */
  cushion: [false, false, false, true],
  rows: [
    { sector: "Airlines", s: [5, 5, 4, 1] },
    { sector: "Oil marketing cos.", s: [3, 5, 4, 1] },
    { sector: "Electronics", s: [2, 5, 3, 2] },
    { sector: "NBFCs", s: [4, 1, 4, 1] },
    { sector: "Renewables", s: [4, 4, 3, 1] },
    { sector: "Refiners", s: [3, 5, 3, 4] },
    { sector: "IT exporters", s: [1, 1, 2, 5] },
    { sector: "Pharma", s: [2, 3, 2, 4] },
  ],
};

export type DataPoint = { label: string; value: string; unit: string; date: string; source: string; url?: string };

/** Catalogue shown on the Sources & Assumptions screen. */
export const dataCatalogue: DataPoint[] = [
  { label: "USD/INR (snapshot)", value: ticker.usdinr.toFixed(2), unit: "₹ per $", date: SNAPSHOT_DATE, source: "BusinessToday: Rupee after US midterms (10 Nov)" },
  { label: "USD/INR record low", value: headline.recordLow.toFixed(2), unit: "₹ per $", date: "May 2026", source: "Team deck" },
  { label: "USD/INR (live)", value: "Live", unit: "₹ per $", date: "Daily", source: "ECB reference rates via Frankfurter", url: "https://frankfurter.dev" },
  { label: "Brent crude", value: ticker.brent.toFixed(1), unit: "$/bbl", date: "15 Oct 2026", source: "Team deck" },
  { label: "Brent crude (live)", value: "Live", unit: "$/bbl", date: "Daily", source: "FRED series DCOILBRENTEU", url: "https://fred.stlouisfed.org/series/DCOILBRENTEU" },
  { label: "US 10-year yield (live)", value: "Live", unit: "%", date: "Daily", source: "FRED series DGS10", url: "https://fred.stlouisfed.org/series/DGS10" },
  { label: "Broad USD index (live)", value: "Live", unit: "index", date: "Daily", source: "FRED series DTWEXBGS", url: "https://fred.stlouisfed.org/series/DTWEXBGS" },
  { label: "US 10-year yield", value: ticker.us10y.toFixed(2), unit: "%", date: SNAPSHOT_DATE, source: "Team deck" },
  { label: "India 10-year yield", value: fpiKpis.in10y, unit: "%", date: "10 Nov 2026", source: "ANI / ICICI: liquidity and bond yields (10 Nov)" },
  { label: "US–India 10Y spread", value: String(headline.spreadBps), unit: "bps", date: "Nov 2026", source: "Team deck" },
  { label: "Dollar index", value: String(ticker.dollarIndex), unit: "index", date: SNAPSHOT_DATE, source: "Team deck" },
  { label: "Fed funds target", value: ticker.fedFunds, unit: "%", date: "Sep 2026", source: "Team deck" },
  { label: "RBI repo rate", value: ticker.repo.toFixed(2), unit: "%", date: "7 Oct 2026", source: "RBI: MPC October 2026 resolution" },
  { label: "SDF (corridor floor)", value: ticker.sdf.toFixed(2), unit: "%", date: "7 Oct 2026", source: "RBI: MPC October 2026 resolution" },
  { label: "MSF / Bank Rate (ceiling)", value: ticker.msf.toFixed(2), unit: "%", date: "7 Oct 2026", source: "RBI: MPC October 2026 resolution" },
  { label: "Call money rate", value: ticker.callRate.toFixed(2), unit: "%", date: "22 Oct 2026", source: "ANI / ICICI: liquidity and bond yields (10 Nov)" },
  { label: "FX reserves", value: ticker.reservesB.toFixed(1), unit: "$B", date: "2 Oct 2026", source: "RBI weekly statistical supplement" },
  { label: "CPI inflation", value: ticker.cpi.toFixed(2), unit: "% y/y", date: "Sep 2026", source: "PIB / MoSPI: CPI September 2026" },
  { label: "Food inflation", value: "7.74", unit: "% y/y", date: "Sep 2026", source: "PIB / MoSPI: CPI September 2026" },
  { label: "Rural food inflation", value: corporate.ruralFood.toFixed(2), unit: "% y/y", date: "Sep 2026", source: "PIB / MoSPI: CPI September 2026" },
  { label: "WPI inflation", value: ticker.wpi.toFixed(1), unit: "% y/y", date: "2026", source: "Team deck" },
  { label: "REER (40-currency)", value: ticker.reer.toFixed(1), unit: "index", date: "Sep 2026", source: "Team deck" },
  { label: "1M forward premium", value: ticker.fwdPremium1M.toFixed(2), unit: "% ann.", date: "Oct 2026", source: "Moody's via TradingView: forward premiums" },
  { label: "Forward premium before curbs", value: corporate.fwdPremiumPath[0].toFixed(2), unit: "% ann.", date: "2026", source: "Moody's via TradingView: forward premiums" },
  { label: "Current account deficit", value: headline.cadPctGDP.toFixed(1), unit: "% of GDP", date: "Q1 FY27", source: "RBI: BoP press release Q1 FY27" },
  { label: "Merchandise trade gap", value: headline.tradeGapB.toFixed(1), unit: "$B", date: "FY26", source: "Finnovate: FY26 trade data" },
  { label: "Combined fiscal deficit", value: headline.combinedFiscal.toFixed(1), unit: "% of GDP", date: "FY26", source: "Livemint: Union Budget 2026-27" },
  { label: "Net capital outflow", value: headline.netCapitalOutflowQ1B.toFixed(1), unit: "$B", date: "Q1 FY27", source: "RBI: BoP press release Q1 FY27" },
  { label: "Balance of payments", value: headline.bopB.toFixed(2), unit: "$B", date: "Q1 FY27", source: "RBI: BoP press release Q1 FY27" },
  { label: "External debt", value: String(headline.externalDebtB), unit: "$B", date: "Jun 2026", source: "Chartforest (RBI data): External debt, June 2026" },
  { label: "Short-term debt / reserves", value: String(headline.stDebtPctReserves), unit: "%", date: "Jun 2026", source: "Chartforest (RBI data): External debt, June 2026" },
  { label: "Foreign stake in Indian equities", value: headline.foreignStake, unit: "", date: "2026", source: "Business Standard: Record FPI outflows (13 Oct)" },
  { label: "FPI equity exit", value: headline.fpiEquityExit, unit: "", date: "2026", source: "Business Standard: Record FPI outflows (13 Oct)" },
  { label: "FPI inflow 2–9 Nov", value: fpiKpis.nov2to9Inflow, unit: "", date: "Nov 2026", source: "BusinessToday: Rupee after US midterms (10 Nov)" },
  { label: "RBI net spot sales", value: String(rbiDefence.netSpotSalesFY26B), unit: "$B", date: "FY26", source: "ETBFSI: RBI's record FY26 defence" },
  { label: "RBI gross sales", value: String(rbiDefence.grossSalesFY26B), unit: "$B", date: "FY26", source: "ETBFSI: RBI's record FY26 defence" },
  { label: "RBI forward short book", value: String(rbiDefence.forwardShortBookB), unit: "$B", date: "2026", source: "BusinessLine: Spot and forward dollar sales" },
  { label: "Forward book (Ambit estimate)", value: "~200", unit: "$B", date: "16 Oct 2026", source: "CNBC: forward book (16 Oct, Ambit)" },
  { label: "Liquidity drained per $1B sold", value: rbiDefence.rupeesPerBillionCr.toLocaleString("en-IN"), unit: "₹ Cr", date: "2026", source: "Team deck" },
  { label: "ECB borrowings", value: String(corporate.ecbTotalB), unit: "$B", date: "2026", source: "Urbanomics: external exposure" },
  { label: "Unhedged ECBs", value: String(corporate.ecbUnhedgedB), unit: "$B", date: "2026", source: "MUFG via FXStreet: FX curbs and hedging" },
  { label: "Refinancing due by Mar 2028", value: String(corporate.refinancingCliffB), unit: "$B", date: "2026", source: "Team deck" },
  { label: "Crude import reliance", value: String(headline.crudeReliance), unit: "%", date: "FY26", source: "PolicyCircle: strategic oil reserves" },
  { label: "Q1 oil import bill", value: headline.q1OilBillB.toFixed(1), unit: "$B", date: "Q1 FY27", source: "Team deck" },
  { label: "Gold import bill", value: String(headline.goldBillB), unit: "$B", date: "FY26", source: "India Today: gold curbs" },
  { label: "Exchange-rate pass-through", value: corporate.passThrough, unit: "", date: "2025", source: "Bank of Baroda: imported inflation (2025)" },
  { label: "Ideal rupee zone", value: "85–88", unit: "₹ per $", date: SNAPSHOT_DATE, source: "Team analysis (REER 98–100 equilibrium)" },
];

export const dataLinks = [
  { label: "Frankfurter (ECB reference rates)", url: "https://frankfurter.dev" },
  { label: "FRED, Federal Reserve Bank of St. Louis", url: "https://fred.stlouisfed.org" },
  { label: "Reserve Bank of India", url: "https://www.rbi.org.in" },
  { label: "Charts: TradingView Lightweight Charts", url: "https://www.tradingview.com/lightweight-charts/" },
];
