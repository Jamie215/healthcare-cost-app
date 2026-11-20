import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import type { NewVisit, Visit } from '@/domain/visit';

import { useEmpower } from './empower';

type VisitsState = {
  visits: Visit[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addVisit: (visit: NewVisit) => Promise<Visit>;
};

const VisitsContext = createContext<VisitsState | null>(null);

/** Loads the participant's visits from EmPOWER and keeps Home in sync after saving. */
export function VisitsProvider({ children }: { children: ReactNode }) {
  const client = useEmpower();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setVisits(await client.listVisits());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your visits');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const addVisit = useCallback(
    async (visit: NewVisit) => {
      const saved = await client.createVisit(visit);
      await refresh();
      return saved;
    },
    [client, refresh],
  );

  // Initial load. State is only set from the promise callbacks, after an unmount check.
  useEffect(() => {
    let active = true;
    client
      .listVisits()
      .then((loaded) => {
        if (!active) return;
        setVisits(loaded);
        setError(null);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Could not load your visits');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client]);

  return (
    <VisitsContext.Provider value={{ visits, loading, error, refresh, addVisit }}>
      {children}
    </VisitsContext.Provider>
  );
}

export function useVisits(): VisitsState {
  const state = useContext(VisitsContext);
  if (!state) throw new Error('useVisits must be used inside <VisitsProvider>');
  return state;
}
