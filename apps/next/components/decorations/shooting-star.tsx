'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ShootingStar {
  id: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
  speed: number;
  distance: number;
}

const getRandomStartPoint = () => {
  const side = Math.floor(Math.random() * 4);
  const offset = Math.random() * window.innerWidth;

  switch (side) {
    case 0:
      return { x: offset, y: 0, angle: 45 };
    case 1:
      return { x: window.innerWidth, y: offset, angle: 135 };
    case 2:
      return { x: offset, y: window.innerHeight, angle: 225 };
    case 3:
      return { x: 0, y: offset, angle: 315 };
    default:
      return { x: 0, y: 0, angle: 45 };
  }
};

const ShootingStars: React.FC = () => {
  const [star, setStar] = useState<ShootingStar | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Kept: spawning a star on a random delay is scheduling, which has no
  // render-phase equivalent. The hazard is specific and this used to have it —
  // `createStar` re-arms itself, and the cleanup was empty, so the chain
  // outlived the component and went on calling `setStar` forever. Holding the
  // pending id and clearing it is what bounds the recursion to the mount.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const createStar = () => {
      const { x, y, angle } = getRandomStartPoint();
      setStar({
        id: Date.now(),
        x,
        y,
        angle,
        scale: 1,
        speed: Math.random() * 20 + 10,
        distance: 0,
      });

      const randomDelay = Math.random() * 4500 + 4200;
      timeout = setTimeout(createStar, randomDelay);
    };

    createStar();

    return () => clearTimeout(timeout);
  }, []);

  // Kept: an animation frame is an external scheduler. Re-running per `star` is
  // what advances the position — each frame sets state, which re-runs this and
  // queues the next. The hazard is a frame surviving the component, so the
  // cleanup cancels it.
  useEffect(() => {
    const moveStar = () => {
      if (star) {
        setStar((prevStar) => {
          if (!prevStar) return null;
          const newX =
            prevStar.x +
            prevStar.speed * Math.cos((prevStar.angle * Math.PI) / 180);
          const newY =
            prevStar.y +
            prevStar.speed * Math.sin((prevStar.angle * Math.PI) / 180);
          const newDistance = prevStar.distance + prevStar.speed;
          const newScale = 1 + newDistance / 100;
          if (
            newX < -20 ||
            newX > window.innerWidth + 20 ||
            newY < -20 ||
            newY > window.innerHeight + 20
          ) {
            return null;
          }
          return {
            ...prevStar,
            x: newX,
            y: newY,
            distance: newDistance,
            scale: newScale,
          };
        });
      }
    };

    const animationFrame = requestAnimationFrame(moveStar);
    return () => cancelAnimationFrame(animationFrame);
  }, [star]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {star && (
        <rect
          key={star.id}
          x={star.x}
          y={star.y}
          width={10 * star.scale}
          height="2"
          fill="url(#gradient)"
          transform={`rotate(${star.angle}, ${
            star.x + (10 * star.scale) / 2
          }, ${star.y + 1})`}
        />
      )}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#2EB9DF', stopOpacity: 0 }} />
          <stop
            offset="100%"
            style={{ stopColor: '#9E00FF', stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default ShootingStars;
