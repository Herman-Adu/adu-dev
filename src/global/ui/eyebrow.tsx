import type { ReactNode } from "react";
import { cn } from "@/global/lib/cn";

/** mute is the section marker; secondary is the hero's standfirst line;
 *  brand marks the one accent section per page. */
type Tone = "mute" | "secondary" | "brand";

const tones: Record<Tone, string> = {
  mute: "text-ink-3",
  secondary: "text-ink-2",
  brand: "text-brand",
};

/** Mono, tracked, uppercase. Reserved for metadata and section markers. */
export function Eyebrow({
  children,
  tone = "mute",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}
