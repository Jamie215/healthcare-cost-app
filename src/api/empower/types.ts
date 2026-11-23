import { z } from 'zod';

import type { NewVisit, Visit } from '@/domain/visit';

/**
 * The app's contract with the EmPOWER backend.
 *
 * Screens and hooks only ever talk to this interface, never to `fetch` directly, so the
 * mock and the real HTTP client are interchangeable. The method list reflects what the
 * handoff document needs (sign-in, persistent per-participant storage). Shapes are our
 * best guess until EmPOWER's API documentation is available; adjust them here first.
 */
export interface EmpowerClient {
  /** Current session, or null when signed out. */
  getSession(): Promise<Session | null>;
  signIn(credentials: SignInCredentials): Promise<Session>;
  signOut(): Promise<void>;

  listVisits(): Promise<VisitList>;
  createVisit(visit: NewVisit): Promise<Visit>;
  deleteVisit(id: string): Promise<void>;
}

/**
 * The participant's visits. A record the app cannot read (it does not match the saved visit
 * schema) is left out of `visits` and counted in `unreadable`, so Home can say so instead
 * of hiding it silently or refusing to show anything. The record stays on the server.
 */
export type VisitList = {
  visits: Visit[];
  unreadable: number;
};

export const participantSchema = z.object({
  id: z.string().min(1),
  displayName: z.string(),
});

export const sessionSchema = z.object({
  participant: participantSchema,
  /** Opaque token from EmPOWER. Never log it or store it outside secure storage. */
  accessToken: z.string().min(1),
  expiresAt: z.string().optional(),
});

export type Participant = z.infer<typeof participantSchema>;
export type Session = z.infer<typeof sessionSchema>;

/**
 * Placeholder. If EmPOWER uses an OAuth/OpenID Connect redirect, this becomes a
 * redirect flow (expo-auth-session) instead of a username and password.
 */
export type SignInCredentials = {
  username: string;
  password: string;
};

export class EmpowerError extends Error {
  /**
   * @param message Plain-language message, safe to show on screen.
   * @param details For developers: which fields were wrong and how. Never contains the
   *   values themselves, which are participant data.
   */
  constructor(
    message: string,
    readonly status?: number,
    readonly details: readonly string[] = [],
  ) {
    super(message);
    this.name = 'EmpowerError';
  }
}
