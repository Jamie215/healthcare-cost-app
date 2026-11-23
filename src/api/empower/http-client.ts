import type { z } from 'zod';

import { visitSchema, type NewVisit, type Visit } from '@/domain/visit';

import {
  EmpowerError,
  sessionSchema,
  type EmpowerClient,
  type Session,
  type SignInCredentials,
  type VisitList,
} from './types';

const UNREADABLE_REPLY =
  "EmPOWER sent a reply this app doesn't understand. Please try again later.";
const TOO_SLOW = 'EmPOWER took too long to respond. Check your internet connection and try again.';
const UNREACHABLE = "Couldn't reach EmPOWER. Check your internet connection and try again.";

/**
 * Describes what was wrong for developers: the field and the problem, never the value,
 * which is participant data. For example "expenses.0.amountCents: Invalid input: ...".
 */
function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.join('.') || '(whole reply)'}: ${i.message}`);
}

/** Checks a reply against its schema, so the rest of the app can trust the types. */
function check<S extends z.ZodType>(schema: S, data: unknown, message = UNREADABLE_REPLY) {
  const r = schema.safeParse(data);
  if (!r.success) throw new EmpowerError(message, undefined, describeIssues(r.error));
  return r.data as z.output<S>;
}

/**
 * Skeleton for the real EmPOWER client. Endpoint paths below are placeholders until
 * EmPOWER's API documentation is available. Tokens should move to expo-secure-store
 * once the sign-in flow is known.
 *
 * Every reply is checked against the schemas in `src/domain/visit.ts` and `./types`
 * before the app uses it. If EmPOWER's format turns out to differ (other field names,
 * null instead of a missing field), convert it here, in one place, before checking.
 */
export function createHttpEmpowerClient(
  baseUrl: string,
  {
    /** Give up on a request (including reading its reply) after this long. */
    timeoutMs = 15_000,
  }: { timeoutMs?: number } = {},
): EmpowerClient {
  let session: Session | null = null;
  // Join by hand: `new URL('/visits', 'https://host/api/v1')` would drop `/api/v1`, because
  // a path starting with `/` replaces everything after the host.
  const root = baseUrl.replace(/\/+$/, '');

  /**
   * Sends a request and returns the reply body, unchecked (`unknown`) until a schema says so.
   * Gives up after `timeoutMs`, so a weak connection shows a message instead of an endless
   * spinner. AbortController is the standard way to cancel a fetch.
   */
  async function send(path: string, init: RequestInit = {}): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${root}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
          ...init.headers,
        },
      });
      if (!res.ok) throw new EmpowerError(`EmPOWER request failed: ${res.status}`, res.status);
      if (res.status === 204) return undefined;
      try {
        return await res.json();
      } catch (e) {
        if (controller.signal.aborted) throw e; // timed out while reading: handled below
        throw new EmpowerError(UNREADABLE_REPLY, res.status, ['reply is not valid JSON']);
      }
    } catch (e) {
      if (e instanceof EmpowerError) throw e;
      // Anything else from fetch is the connection: cancelled by our timer, or no network.
      throw new EmpowerError(controller.signal.aborted ? TOO_SLOW : UNREACHABLE, undefined, [
        String(e),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async getSession() {
      return session;
    },
    async signIn(credentials: SignInCredentials) {
      const reply = await send('/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      session = check(sessionSchema, reply);
      return session;
    },
    async signOut() {
      session = null;
    },
    async listVisits(): Promise<VisitList> {
      const reply = await send('/visits');
      if (!Array.isArray(reply)) {
        throw new EmpowerError(UNREADABLE_REPLY, undefined, ['(whole reply): expected a list']);
      }
      // Check each record on its own: one unreadable record should not hide the others.
      const visits: Visit[] = [];
      let unreadable = 0;
      for (const record of reply) {
        const r = visitSchema.safeParse(record);
        if (r.success) {
          visits.push(r.data);
        } else {
          unreadable++;
          if (__DEV__) console.warn('Skipped an unreadable visit:', describeIssues(r.error));
        }
      }
      return { visits, unreadable };
    },
    async createVisit(visit: NewVisit) {
      const reply = await send('/visits', { method: 'POST', body: JSON.stringify(visit) });
      // The visit was probably saved even if the reply is unreadable, so warn against
      // saving it twice.
      return check(
        visitSchema,
        reply,
        "Your visit was sent, but EmPOWER's reply wasn't understood. Check Recent entries " +
          'before saving it again.',
      );
    },
    async deleteVisit(id: string) {
      await send(`/visits/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
  };
}
