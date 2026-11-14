"use client";
import * as T from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

export function Tip({ content, children, side = "bottom" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <T.Root delayDuration={200}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} sideOffset={6} className="tip">
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
