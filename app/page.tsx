import { RightRail } from "@/components/frame/RightRail";
import { ScenarioInputs } from "@/components/stress/ScenarioInputs";
import { KpiStrip } from "@/components/stress/KpiStrip";
import { FanChart } from "@/components/stress/FanChart";
import { CrisisMeter } from "@/components/stress/CrisisMeter";
import { WhatThisMeans } from "@/components/stress/WhatThisMeans";
import { NextSteps } from "@/components/stress/NextSteps";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScenarioBadge } from "@/components/stress/ScenarioBadge";

export default function StressEngine() {
  return (
    <div className="stress">
      <ScenarioInputs />
      <div className="col cq">
        <PageHeader index="01" group="SIMULATE" title="Stress Engine" desc="Move a lever. Watch the rupee, prices, reserves and banks react in real time." right={<ScenarioBadge />} />
        <KpiStrip />
        <FanChart />
        <div className="duo">
          <CrisisMeter />
          <WhatThisMeans />
        </div>
        <NextSteps />
      </div>
      <RightRail />
    </div>
  );
}
