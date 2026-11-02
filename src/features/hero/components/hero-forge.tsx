"use client";

import { useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useScrollScene } from "@/features/scroll/lib/use-scroll-scene";
import { COLOR, FORGE } from "../lib/forge-config";
import { ForgeScene } from "./forge-scene";

/**
 * Bridges R3F's on-demand renderer to the outside world. The canvas only
 * draws when something asks it to, so a still page costs zero GPU.
 */
function InvalidateBridge({
  register,
}: {
  register: (fn: () => void) => void;
}) {
  const { invalidate } = useThree();
  useEffect(() => {
    register(invalidate);
    invalidate();
  }, [invalidate, register]);
  return null;
}

export function HeroForge() {
  const progress = useRef<number>(1);
  const invalidateRef = useRef<(() => void) | null>(null);

  const register = useCallback((fn: () => void) => {
    invalidateRef.current = fn;
  }, []);

  const scopeRef = useScrollScene<HTMLElement>({
    full: ({ scope, ScrollTrigger }) => {
      progress.current = 0;
      invalidateRef.current?.();

      ScrollTrigger.create({
        trigger: scope,
        start: "top top",
        end: "+=300%",
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progress.current = self.progress;
          // Draw exactly one frame per scroll tick. No rAF loop, no idle cost.
          invalidateRef.current?.();
        },
      });
    },

    // Narrow viewports and reduced motion both get the assembled end state,
    // rendered once. Nothing pins, nothing scrubs.
    compact: () => {
      progress.current = 1;
      invalidateRef.current?.();
    },
    reduced: () => {
      progress.current = 1;
      invalidateRef.current?.();
    },
  });

  return (
    <section
      ref={scopeRef}
      aria-labelledby="forge-heading"
      className="relative isolate min-h-[100svh] overflow-hidden"
    >
      <div className="absolute inset-0 -z-10">
        <Canvas
          frameloop="demand"
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          camera={{ fov: 42, position: [0, 0, FORGE.cameraZ[0]] }}
          onCreated={({ gl }) => gl.setClearColor(COLOR.ground, 1)}
        >
          <InvalidateBridge register={register} />
          <ForgeScene progress={progress} />
        </Canvas>
      </div>

      {/* Copy sits over the scene and never scrubs. It is legible at every
          scroll position, including the first frame. */}
      <div className="pointer-events-none relative flex min-h-[100svh] items-end">
        <div className="mx-auto w-full max-w-[1280px] px-6 pb-20 sm:px-10 lg:px-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            02 — The forge
          </p>
          <h2
            id="forge-heading"
            className="mt-6 max-w-[18ch] text-[clamp(32px,5.5vw,72px)] font-extrabold leading-[1.02] tracking-[-0.035em]"
          >
            Scattered parts. One system.
          </h2>
          <p className="mt-6 max-w-[48ch] text-[17px] leading-[1.6] text-ink-2">
            Design, contracts, features and infrastructure arrive separately
            on most projects. Here they are assembled by the same hands, in
            one pass, against one set of rules.
          </p>
        </div>
      </div>
    </section>
  );
}
