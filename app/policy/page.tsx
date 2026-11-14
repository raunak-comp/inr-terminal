import { IdealGauge, OurAnswer, Roadmap, Scorecard, TripwireTable, ZoneTable } from "@/components/screens/PolicyLab";
import { ScorecardRadar } from "@/components/screens/PolicyExtras";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";

export default function PolicyLab() {
  return (
    <div className="screen">
      <PageHeader index="08" group="POLICY" title="Policy Lab" desc="Defend the volatility, not the level: the ideal rupee, the options, and our phased plan." />
      <div className="g12">
        <IdealGauge />
        <ZoneTable />
        <SectionLabel n="02" title="Choosing the tools" desc="Every option has a cost; ours balances them" />
        <Scorecard />
        <ScorecardRadar />
        <SectionLabel n="03" title="The plan and the guard-rails" />
        <Roadmap />
        <OurAnswer />
        <TripwireTable />
      </div>
    </div>
  );
}
