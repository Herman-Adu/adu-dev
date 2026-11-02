import type { ReactNode } from "react";
import { cn } from "@/global/lib/cn";

/** The page gutter. 16px minimum at phone width, never horizontal scroll. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1280px] px-6 sm:px-10 lg:px-20",
        className,
      )}
    >
      {children}
    </div>
  );
}
