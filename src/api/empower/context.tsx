import { createContext, useContext, useState, type ReactNode } from 'react';

import type { EmpowerClient } from './types';

const EmpowerContext = createContext<EmpowerClient | null>(null);

export function EmpowerProvider({
  client,
  children,
}: {
  client: EmpowerClient | (() => EmpowerClient);
  children: ReactNode;
}) {
  const [value] = useState(client);
  return <EmpowerContext.Provider value={value}>{children}</EmpowerContext.Provider>;
}

export function useEmpower(): EmpowerClient {
  const client = useContext(EmpowerContext);
  if (!client) throw new Error('useEmpower must be used inside <EmpowerProvider>');
  return client;
}
