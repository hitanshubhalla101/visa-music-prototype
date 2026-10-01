import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FlowKey } from '../config/campaign';
import { FLOWS, useDemo } from '../state/DemoContext';

/** Deep link to any state for rehearsal: /access?step=code, /sweepstakes?step=dja */
export function useStepParam(flow: FlowKey) {
  const [params, setParams] = useSearchParams();
  const { go } = useDemo();
  const want = params.get('step');
  useEffect(() => {
    if (want && FLOWS[flow].steps.some((s) => s.id === want)) go(flow, want);
    if (want) setParams({}, { replace: true });
  }, [want, flow, go, setParams]);
}
