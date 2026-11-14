import { RightRail } from "@/components/frame/RightRail";
import { BrentChart, FpiChart, KpiRow, LiquidityChart, ReservesChart, RupeeChart } from "@/components/screens/Overview";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { Corridor } from "@/components/stress/Corridor";

export default function Markets() {
  return (
    <div className="with-rail">
      <div className="cq">
        <PageHeader index="04" group="MARKETS" title="Markets" desc="The rupee, oil, reserves, foreign money and bank cash: what actually happened in 2026." />
        <div className="g12">
          <KpiRow />
          <RupeeChart />
          <BrentChart />
          <SectionLabel n="02" title="Pressure gauges" desc="Reserves, foreign flows and the banking system" />
          <ReservesChart />
          <FpiChart />
          <LiquidityChart />
          <Corridor className="col-span-12 lg:col-span-6 2xl:col-span-12" />
        </div>
      </div>
      <RightRail />
    </div>
  );
}
