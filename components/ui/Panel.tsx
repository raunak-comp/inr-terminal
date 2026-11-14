import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  letter?: string;
  title: ReactNode;
  right?: ReactNode;
  source?: ReactNode;
  stamp?: ReactNode;
  model?: boolean;
  flush?: boolean;
  className?: string;
  bodyClass?: string;
  children: ReactNode;
};

export function Panel({ letter, title, right, source, stamp, model, flush, className, bodyClass, children }: Props) {
  return (
    <section className={clsx("panel", className)}>
      <header className="panel-h">
        <h2 className="panel-t">
          {letter && <span className="lt">({letter})</span>}
          {title}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {model && <span className="tag">Model estimate</span>}
          {right}
        </div>
      </header>
      <div className={clsx("panel-b", flush && "flush", bodyClass)}>{children}</div>
      {(source || stamp) && (
        <footer className="panel-f">
          <span>{source ? <>Source: {source}</> : null}</span>
          {stamp && <span className="mono shrink-0">{stamp}</span>}
        </footer>
      )}
    </section>
  );
}
