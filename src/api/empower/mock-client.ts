import type { NewVisit, Visit } from '@/domain/visit';

import { EmpowerError, type EmpowerClient, type Session, type SignInCredentials } from './types';

const DEMO_SESSION: Session = {
  participant: { id: 'demo-participant', displayName: 'Demo participant' },
  accessToken: 'mock-token',
};

type Options = {
  /** Start signed in, so the prototype opens straight to Home. Defaults to true. */
  signedIn?: boolean;
  visits?: Visit[];
  /** Artificial delay in ms, to exercise loading states. */
  latency?: number;
};

/**
 * In-memory EmPOWER stand-in. Like the prototype, data lasts only for the session:
 * nothing is sent anywhere. Use fictional information only.
 */
export function createMockEmpowerClient(options: Options = {}): EmpowerClient {
  let session: Session | null = options.signedIn === false ? null : DEMO_SESSION;
  let visits: Visit[] = [...(options.visits ?? [])];
  let nextId = visits.length + 1;
  const wait = () =>
    options.latency ? new Promise((r) => setTimeout(r, options.latency)) : Promise.resolve();

  const requireSession = () => {
    if (!session) throw new EmpowerError('Not signed in', 401);
  };

  return {
    async getSession() {
      await wait();
      return session;
    },
    async signIn({ username, password }: SignInCredentials) {
      await wait();
      if (!username || !password) throw new EmpowerError('Enter your username and password', 400);
      session = {
        ...DEMO_SESSION,
        participant: { ...DEMO_SESSION.participant, displayName: username },
      };
      return session;
    },
    async signOut() {
      await wait();
      session = null;
    },
    async listVisits() {
      await wait();
      requireSession();
      return [...visits].sort((a, b) => b.date.localeCompare(a.date));
    },
    async createVisit(visit: NewVisit) {
      await wait();
      requireSession();
      const saved: Visit = {
        ...visit,
        id: `visit-${nextId++}`,
        createdAt: new Date().toISOString(),
      };
      visits = [...visits, saved];
      return saved;
    },
    async deleteVisit(id: string) {
      await wait();
      requireSession();
      visits = visits.filter((v) => v.id !== id);
    },
  };
}
