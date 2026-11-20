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

  listVisits(): Promise<Visit[]>;
  createVisit(visit: NewVisit): Promise<Visit>;
  deleteVisit(id: string): Promise<void>;
}

export type Participant = {
  id: string;
  displayName: string;
};

export type Session = {
  participant: Participant;
  /** Opaque token from EmPOWER. Never log it or store it outside secure storage. */
  accessToken: string;
  expiresAt?: string;
};

/**
 * Placeholder. If EmPOWER uses an OAuth/OpenID Connect redirect, this becomes a
 * redirect flow (expo-auth-session) instead of a username and password.
 */
export type SignInCredentials = {
  username: string;
  password: string;
};

export class EmpowerError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'EmpowerError';
  }
}
