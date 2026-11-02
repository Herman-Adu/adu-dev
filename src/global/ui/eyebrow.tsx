import type { ReactNode } from "react";
import { cn } from "@/global/lib/cn";

/** Mono, tracked, uppercase. Reserved for metadata and section markers. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3",
        className,
      )}
    >
      {children}
    </p>
  );
}
