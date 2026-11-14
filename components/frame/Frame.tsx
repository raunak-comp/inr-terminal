"use client";
import * as T from "@radix-ui/react-tooltip";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useMarketFeeds } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { CommandPalette } from "./CommandPalette";
import { Footer } from "./Footer";
import { NAV } from "./nav";
import { Sidebar } from "./Sidebar";
import { Ticker } from "./Ticker";
import { TopBar } from "./TopBar";
import { WireManager, WireToast } from "./Wire";
import { UrlSync } from "@/components/stress/UrlSync";

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
};

export function Frame({ children }: { children: ReactNode }) {
  useMarketFeeds();
  const router = useRouter();
  const path = usePathname();
  const present = useStore((s) => s.present);

  useEffect(() => {
    document.documentElement.classList.toggle("present", present);
  }, [present]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useStore.getState();
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        st.setPalette(!st.paletteOpen);
        return;
      }
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey) && !typing(e.target)) {
        e.preventDefault();
        st.undo();
        return;
      }
      if (e.key === "Escape") {
        if (st.paletteOpen) st.setPalette(false);
        else if (st.present) st.setPresent(false);
        return;
      }
      if (typing(e.target) || st.paletteOpen || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        st.setPalette(true);
      } else if (e.key === "f" || e.key === "F") {
        if (!st.present && path !== "/") router.push("/");
        st.setPresent(!st.present);
      } else if (/^[1-9]$/.test(e.key) && !st.present) {
        router.push(NAV[Number(e.key) - 1].href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, path]);

  return (
    <T.Provider delayDuration={200}>
      <div className="app">
        <TopBar />
        <Ticker />
        <Sidebar />
        <main className="main">{children}</main>
        <Footer />
      </div>
      <CommandPalette />
      <WireManager />
      <UrlSync />
      <WireToast />
    </T.Provider>
  );
}
