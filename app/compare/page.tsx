import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { CompareTable, ComparePicker, DriverRadar, Frontier, Histogram, PathChart } from "@/components/screens/Compare";

export default function ScenarioCompare() {
  return (
    <div className="screen">
      <PageHeader index="03" group="SIMULATE" title="Scenario Compare" desc="Seven possible futures for the rupee, side by side. Pick up to four to overlay." />
      <div className="g12">
        <ComparePicker />
        <DriverRadar />
        <PathChart />
        <CompareTable />
        <SectionLabel n="02" title="Risk and trade-offs" desc="What each choice costs, and how wide the range of outcomes is" />
        <Frontier />
        <Histogram />
      </div>
    </div>
  );
}
