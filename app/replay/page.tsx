import { PageHeader } from "@/components/ui/PageHeader";
import { Replay } from "@/components/screens/Replay";

export default function ReplayPage() {
  return (
    <div className="screen">
      <PageHeader index="06" group="MARKETS" title="2026 Replay" desc="Press Play and relive the year: Hormuz, the record low, the Fed, the RBI and the rebound." />
      <div className="g12">
        <Replay />
      </div>
    </div>
  );
}
