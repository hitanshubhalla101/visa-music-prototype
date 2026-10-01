import type { FlowKey } from '../config/campaign';

export type StepGroup = 'journey' | 'exception';

/** One state of a consumer journey, and what the presenter says about it. */
export interface StepDef {
  id: string;
  /** Short name in the presenter's state list. */
  label: string;
  group: StepGroup;
  /** CONSUMER SEES — what is on screen. */
  consumer: string;
  /** PLATFORM DOES — what the platform is assumed to do behind the scenes. */
  platform: string[];
  /** DECISION TO CONFIRM — questions for Visa. */
  decisions: string[];
}

export interface FlowDef {
  key: FlowKey;
  title: string;
  path: string;
  steps: StepDef[];
  /** The ordered happy path that Previous / Next walk. */
  walk: string[];
  /** Consumer progress rail: label and the steps it covers. */
  rail: Array<{ label: string; steps: string[] }>;
}

export function stepById(flow: FlowDef, id: string): StepDef {
  return flow.steps.find((s) => s.id === id) ?? flow.steps[0];
}
