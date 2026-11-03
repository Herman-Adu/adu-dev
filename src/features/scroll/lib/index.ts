/**
 * The scroll feature's public surface. Other features import from here and
 * never reach into the files below it.
 */
export { useScrollScene, BREAKPOINTS } from "./use-scroll-scene";
export type { SceneSetup, ScrollSceneHandlers } from "./use-scroll-scene";
export { SequenceScene } from "../components/sequence-scene";
export type { SequenceSceneProps } from "../components/sequence-scene";
