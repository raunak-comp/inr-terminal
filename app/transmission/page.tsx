import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { ScenarioDock } from "@/components/lab/ScenarioDock";
import { CausalNetwork, DollarSankey, NodeInspector, StressHeatmap, Tornado } from "@/components/screens/Transmission";
import { Waterfall } from "@/components/stress/Waterfall";

export default function TransmissionLab() {
  return (
    <div className="screen">
      <PageHeader index="02" group="SIMULATE" title="Transmission Lab" desc="Follow a shock from oil wells and Fed meetings to Indian prices, banks and reserves." />
      <div className="g12">
        <ScenarioDock />
        <SectionLabel n="01" title="The chain reaction" desc="Every arrow is a model equation; moving dots show where a shock is travelling" />
        <CausalNetwork />
        <NodeInspector />
        <SectionLabel n="02" title="The dollar gap" desc="Who supplies dollars, who demands them, and what the rupee must absorb" />
        <DollarSankey />
        <Waterfall className="col-span-12 xl:col-span-6" />
        <SectionLabel n="03" title="What matters most" desc="Sensitivity and the full stress surface" />
        <Tornado />
        <StressHeatmap />
      </div>
    </div>
  );
}
