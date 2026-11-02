"use client";

import { useRef, useState } from "react";
import { useScrollScene } from "../lib/use-scroll-scene";

export interface SequenceSceneProps {
  /** Total frames in the exported sequence. */
  frameCount: number;
  /** Builds the URL for frame `i` (1-indexed). */
  frameSrc: (i: number) => string;
  /** The end-state still. Paints immediately, owns LCP, and is the
   *  reduced-motion and mobile fallback. Never optional. */
  posterSrc: string;
  /** Described for screen readers — the scene's content must be readable
   *  without seeing a single frame. */
  alt: string;
  /** How much scroll the pin consumes, in viewport heights. */
  pinVh?: number;
  /** Frames fetched before the scene is considered ready. */
  eagerFrames?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Apple-style frame-sequence scrub.
 *
 * The canvas is decorative: the poster <img> carries the alt text and is
 * what a reduced-motion or no-JS visitor sees. We never scrub opacity on
 * body copy — only the imagery moves.
 */
export function SequenceScene({
  frameCount,
  frameSrc,
  posterSrc,
  alt,
  pinVh = 300,
  eagerFrames = 12,
  className,
  children,
}: SequenceSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const [ready, setReady] = useState(false);

  const scopeRef = useScrollScene<HTMLDivElement>(
    {
      full: ({ scope, gsap }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const load = (i: number) => {
          const existing = framesRef.current[i];
          if (existing) return existing;
          const img = new Image();
          img.decoding = "async";
          img.src = frameSrc(i + 1);
          framesRef.current[i] = img;
          return img;
        };

        // Eager head of the sequence so the first scroll never stalls.
        for (let i = 0; i < Math.min(eagerFrames, frameCount); i++) load(i);
        Promise.allSettled(
          framesRef.current.slice(0, eagerFrames).map((f) => f.decode?.()),
        ).then(() => setReady(true));

        const fit = () => {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = canvas.clientWidth * dpr;
          canvas.height = canvas.clientHeight * dpr;
        };
        fit();

        const draw = (index: number) => {
          const img = load(index);
          if (!img.complete || img.naturalWidth === 0) return;
          const cw = canvas.width;
          const ch = canvas.height;
          const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
          const w = img.naturalWidth * scale;
          const h = img.naturalHeight * scale;
          ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
        };

        const state = { frame: 0 };

        gsap.to(state, {
          frame: frameCount - 1,
          ease: "none",
          snap: "frame",
          scrollTrigger: {
            trigger: scope,
            start: "top top",
            end: `+=${pinVh}%`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // Warm the next few frames as we approach them.
            onUpdate: (self) => {
              const head = Math.floor(self.progress * frameCount);
              for (let i = head; i < Math.min(head + 8, frameCount); i++) load(i);
            },
          },
          onUpdate: () => draw(Math.round(state.frame)),
        });

        const onResize = () => {
          fit();
          draw(Math.round(state.frame));
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
      },

      // Narrow viewports: no pin, no sequence download. The poster is the scene.
      compact: () => setReady(true),

      // Reduced motion: identical to compact. The end state is the content.
      reduced: () => setReady(true),
    },
    [frameCount, pinVh, eagerFrames],
  );

  return (
    <section
      ref={scopeRef}
      className={className}
      style={{ position: "relative", minHeight: "100svh", overflow: "hidden" }}
    >
      {/* Poster owns LCP and accessibility. Hidden from AT only once the
          canvas is live, because then the canvas shows the same content. */}
      <img
        src={posterSrc}
        alt={alt}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: ready ? 0 : 1,
          transition: "opacity 300ms var(--ease-ui)",
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
      {children ? (
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      ) : null}
    </section>
  );
}
