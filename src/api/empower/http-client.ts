import type { NewVisit, Visit } from '@/domain/visit';

import { EmpowerError, type EmpowerClient, type Session, type SignInCredentials } from './types';

/**
 * Skeleton for the real EmPOWER client. Endpoint paths below are placeholders until
 * EmPOWER's API documentation is available. Tokens should move to expo-secure-store
 * once the sign-in flow is known.
 */
export function createHttpEmpowerClient(baseUrl: string): EmpowerClient {
  let session: Session | null = null;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(new URL(path, baseUrl), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        ...init.headers,
      },
    });
    if (!res.ok) throw new EmpowerError(`EmPOWER request failed: ${res.status}`, res.status);
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  return {
    async getSession() {
      return session;
    },
    async signIn(credentials: SignInCredentials) {
      session = await request<Session>('/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      return session;
    },
    async signOut() {
      session = null;
    },
    listVisits: () => request<Visit[]>('/visits'),
    createVisit: (visit: NewVisit) =>
      request<Visit>('/visits', { method: 'POST', body: JSON.stringify(visit) }),
    deleteVisit: (id: string) =>
      request<void>(`/visits/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}
