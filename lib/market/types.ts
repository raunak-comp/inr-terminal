export type FeedStatus = "live" | "cached" | "snapshot";
export type FeedId = "usdinr" | "brent" | "us10y" | "usd";

export type Feed = {
  id: FeedId;
  label: string;
  value: number;
  change: number | null;
  series: [string, number][];
  asOf: string;
  source: string;
  status: FeedStatus;
  /** true when series are sparse deck anchor points, not daily data */
  anchors?: boolean;
};
