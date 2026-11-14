import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { ImportTreemap, InflationDots, OutflowWaffle, RupeeCalculator, TwinPath, Vulnerability } from "@/components/screens/Macro";

export default function MacroPulse() {
  return (
    <div className="screen">
      <PageHeader index="05" group="MARKETS" title="Macro Pulse" desc="Why India's dollar gap opened, who it hurts, and how close the economy is to the danger lines." />
      <div className="g12">
        <RupeeCalculator />
        <TwinPath />
        <SectionLabel n="02" title="Where the pressure comes from" desc="Imports, outflows and prices" />
        <ImportTreemap />
        <OutflowWaffle />
        <InflationDots />
        <SectionLabel n="03" title="Distance to danger" desc="Today versus your scenario" />
        <Vulnerability />
      </div>
    </div>
  );
}
