import { EcbDonut, ForwardPremium, FundingCards, LiquidityChain, RefinancingCliff, ScenarioBar, SectorHeatmap } from "@/components/screens/BalanceSheets";
import { CorporateHit } from "@/components/stress/CorporateHit";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";

export default function BalanceSheets() {
  return (
    <div className="screen">
      <PageHeader index="07" group="POLICY" title="Balance Sheets" desc="Who pays when the rupee falls: companies with dollar debt, and banks short of cash." />
      <div className="g12">
        <ScenarioBar />
        <EcbDonut />
        <ForwardPremium />
        <RefinancingCliff />
        <SectionLabel n="02" title="Sectors and banks" desc="Exposure map and the liquidity squeeze" />
        <SectorHeatmap />
        <LiquidityChain />
        <FundingCards />
        <CorporateHit className="col-span-12 xl:col-span-4" />
      </div>
    </div>
  );
}
