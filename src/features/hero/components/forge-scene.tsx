"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  COLOR,
  FORGE,
  buildShards,
  clamp01,
  easeOutExpo,
  lerp,
  shardProgress,
  type Shard,
} from "../lib/forge-config";

export interface ForgeSceneProps {
  /** Scroll progress 0–1, written by ScrollTrigger outside React. */
  progress: React.RefObject<number>;
}

const dummy = new THREE.Object3D();

function useShardField(
  count: number,
  seed: number,
): { shards: Shard[]; ref: React.RefObject<THREE.InstancedMesh | null> } {
  const shards = useMemo(() => buildShards(count, seed), [count, seed]);
  const ref = useRef<THREE.InstancedMesh>(null);
  return { shards, ref };
}

function applyShards(
  mesh: THREE.InstancedMesh | null,
  shards: Shard[],
  t: number,
) {
  if (!mesh) return;

  for (let i = 0; i < shards.length; i++) {
    const s = shards[i];
    if (!s) continue;

    const p = easeOutExpo(shardProgress(s, t));
    const radius = lerp(s.scatter, FORGE.shellRadius, p);

    // Curve the path: drift decays as the shard lands, so trajectories
    // arc in rather than spoking straight at the core.
    const away = 1 - p;
    dummy.position.set(
      s.dir[0] * radius + s.drift[0] * away,
      s.dir[1] * radius + s.drift[1] * away,
      s.dir[2] * radius + s.drift[2] * away,
    );

    dummy.rotation.set(
      s.rotation[0] + s.spin * away,
      s.rotation[1] + s.spin * away,
      s.rotation[2],
    );

    // Fade in by scale rather than opacity — no transparent sorting cost.
    const grow = clamp01(p * 1.4);
    dummy.scale.setScalar(s.scale * grow);

    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
}

export function ForgeScene({ progress }: ForgeSceneProps) {
  const { camera } = useThree();

  const neutral = useShardField(FORGE.shardCount, 20261102);
  const accent = useShardField(FORGE.accentCount, 77001);

  const coreRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Group>(null);

  // Paint the end state once on mount. If motion is reduced the scene is
  // never driven again, so this IS the scene — it must be correct alone.
  useLayoutEffect(() => {
    applyShards(neutral.ref.current, neutral.shards, 1);
    applyShards(accent.ref.current, accent.shards, 1);
  }, [neutral.ref, neutral.shards, accent.ref, accent.shards]);

  useFrame(() => {
    const t = clamp01(progress.current ?? 1);

    applyShards(neutral.ref.current, neutral.shards, t);
    applyShards(accent.ref.current, accent.shards, t);

    // Core emerges in the back half, once the shell has started to form.
    const coreT = easeOutExpo(clamp01((t - 0.35) / 0.5));
    if (coreRef.current) {
      coreRef.current.scale.setScalar(0.001 + coreT * 0.999);
      coreRef.current.rotation.y = t * Math.PI * 0.9;
      coreRef.current.rotation.x = t * Math.PI * 0.2;
    }

    // The orbit draws itself last and tilts upright — the brand gesture.
    const orbitT = easeOutExpo(clamp01((t - 0.5) / 0.5));
    if (orbitRef.current) {
      orbitRef.current.scale.setScalar(0.3 + orbitT * 0.7);
      orbitRef.current.rotation.x = lerp(Math.PI / 2, 1.15, orbitT);
      orbitRef.current.rotation.z = lerp(0, -0.42, orbitT);
      orbitRef.current.rotation.y = t * Math.PI * 0.6;
    }

    camera.position.z = lerp(FORGE.cameraZ[0], FORGE.cameraZ[1], easeOutExpo(t));
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <fog attach="fog" args={[COLOR.ground, FORGE.fogNear, FORGE.fogFar]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 7]} intensity={2.4} />
      <directionalLight position={[-7, 2, 3]} intensity={0.9} />
      <directionalLight position={[0, -6, -4]} intensity={0.5} />

      <group position={[FORGE.offsetX, 0, 0]}>
      {/* Faceted core. Flat shading so every face reads as a cut plane —
          the brand's sharp geometry rule, in three dimensions. */}
      <group ref={coreRef}>
        <mesh>
          <icosahedronGeometry args={[0.92, 0]} />
          <meshStandardMaterial
            color={COLOR.surface}
            roughness={0.42}
            metalness={0.2}
            flatShading
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.IcosahedronGeometry(0.92, 0)]} />
          <lineBasicMaterial color={COLOR.ink3} transparent opacity={0.75} />
        </lineSegments>
      </group>

      {/* The orbit. Three radial segments gives a triangular cross-section,
          so it reads as a cut band rather than a tube. */}
      <group ref={orbitRef}>
        <mesh>
          <torusGeometry args={[FORGE.orbitRadius, 0.011, 3, 180]} />
          <meshBasicMaterial color={COLOR.brand} />
        </mesh>
      </group>

      <instancedMesh
        ref={neutral.ref}
        args={[undefined, undefined, FORGE.shardCount]}
        frustumCulled={false}
      >
        <tetrahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial
          color={COLOR.border}
          roughness={0.42}
          metalness={0.2}
          flatShading
        />
      </instancedMesh>

      <instancedMesh
        ref={accent.ref}
        args={[undefined, undefined, FORGE.accentCount]}
        frustumCulled={false}
      >
        <tetrahedronGeometry args={[0.085, 0]} />
        <meshBasicMaterial color={COLOR.brand} />
      </instancedMesh>
      </group>
    </>
  );
}
