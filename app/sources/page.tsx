import { CoefTable, DataTable, Methodology, SourceList } from "@/components/screens/Sources";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Sources() {
  return (
    <div className="screen">
      <PageHeader index="09" group="REFERENCE" title="Sources & Assumptions" desc="Every number, where it came from, and every model coefficient (editable)." />
      <div className="g12">
        <DataTable />
        <CoefTable />
        <Methodology />
        <SourceList />
      </div>
    </div>
  );
}
