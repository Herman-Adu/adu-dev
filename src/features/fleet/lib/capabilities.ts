/** Scene 04 — what scoping an agent fleet actually involves. Home board. */
export interface Capability {
  label: string;
  body: string;
}

export const FLEET_CAPABILITIES: readonly Capability[] = [
  {
    label: "Scope",
    body: "Which tools, which data, which blast radius — written down before anything runs.",
  },
  {
    label: "Memory",
    body: "A second brain that compounds — notes, decisions and sources an agent can actually cite.",
  },
  {
    label: "Evals",
    body: "If it is not measured it is not shipped. Regression suites on the prompts, not just the code.",
  },
  {
    label: "Handover",
    body: "Your keys, your logs, your runbook. No dependency on me to keep it alive.",
  },
] as const;
