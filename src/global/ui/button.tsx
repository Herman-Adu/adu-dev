import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/global/lib/cn";

type Variant = "primary" | "ghost";
/** sm is the nav bar; md is everything in page content. */
type Size = "sm" | "md";

/** 180ms / (.4,0,.2,1) — the UI token from the Foundations board. */
const base =
  "inline-flex items-center justify-center rounded-[var(--radius-control)] transition-colors duration-[180ms] ease-[var(--ease-ui)]";

const sizes: Record<Size, string> = {
  sm: "min-h-[44px] px-[18px] text-[14px] font-medium",
  md: "min-h-[48px] px-6 text-[15px] font-semibold",
};

/**
 * Ink on brand is --color-ground, never white: white on #F47C00 measures
 * 2.7:1 and fails WCAG AA at every size, including large bold.
 */
const variants: Record<Variant, string> = {
  primary: "bg-brand text-ground hover:bg-[#ff8a1f]",
  ghost: "border border-border text-ink hover:border-ink-3",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link
      href={href}
      className={cn(base, sizes[size], variants[variant], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
