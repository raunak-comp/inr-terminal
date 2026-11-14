export function Footer() {
  return (
    <footer className="footer">
      <span className="truncate">
        Sources: RBI, MoSPI, FRED, ECB/Frankfurter, CNBC, Business Standard, Reuters · Model is illustrative, not a forecast
      </span>
      <span className="flex items-center gap-2 shrink-0 hide-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-pos" />
        System status: Normal
      </span>
    </footer>
  );
}
