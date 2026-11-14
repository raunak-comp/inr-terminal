/// <reference lib="webworker" />
import { simulate, type MCInput } from "../model/montecarlo";

self.onmessage = (e: MessageEvent<{ id: number; input: MCInput }>) => {
  const result = simulate(e.data.input);
  (self as unknown as Worker).postMessage({ id: e.data.id, result });
};
