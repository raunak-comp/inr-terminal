import type { Metadata, Viewport } from "next";
import { plexMono, plexSans } from "@/lib/fonts";
import { Frame } from "@/components/frame/Frame";
import "./globals.css";

export const metadata: Metadata = {
  title: "INR Stress Terminal · The Black Swans",
  description: "Macro & corporate balance-sheet stress engine for the Indian rupee. MacroMinds 3.0.",
};

export const viewport: Viewport = { themeColor: "#0A0A0B", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <Frame>{children}</Frame>
      </body>
    </html>
  );
}
