import type { ReactNode } from "react";

export function PageHeader({ index, group, title, desc, right }: { index: string; group: string; title: string; desc: string; right?: ReactNode }) {
  return (
    <header className="page-h">
      <div className="min-w-0">
        <div className="page-k">
          <span className="w-3 h-px bg-brand" />
          {group} <span className="text-text-3">/</span> {index}
        </div>
        <h1 className="page-title">{title}</h1>
        <p className="page-d">{desc}</p>
      </div>
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </header>
  );
}

export function SectionLabel({ n, title, desc }: { n: string; title: string; desc?: string }) {
  return (
    <div className="section-l col-span-12">
      <span className="mono text-10 text-brand-soft">{n}</span>
      <span className="text-12 text-text font-medium tracking-[0.02em]">{title}</span>
      {desc && <span className="text-12 text-text-3 truncate">{desc}</span>}
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}
