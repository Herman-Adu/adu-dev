import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/global/lib/cn";

type Variant = "primary" | "ghost";

const base =
  "inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-control)] px-6 text-[15px] font-semibold transition-colors duration-150 ease-[var(--ease-ui)]";

/**
 * Ink on brand is --color-base, never white: white on #F47C00 measures
 * 2.7:1 and fails WCAG AA at every size, including large bold.
 */
const variants: Record<Variant, string> = {
  primary: "bg-brand text-ground hover:bg-[#ff8a1f]",
  ghost: "border border-border text-ink hover:border-ink-3",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
