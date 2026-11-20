import { createHttpEmpowerClient } from './http-client';
import { createMockEmpowerClient } from './mock-client';
import type { EmpowerClient } from './types';

export * from './types';
export { createMockEmpowerClient } from './mock-client';
export { EmpowerProvider, useEmpower } from './context';

/**
 * Uses the real EmPOWER API when EXPO_PUBLIC_EMPOWER_API_URL is set, otherwise the
 * in-memory mock. Reviews and tests run on the mock.
 */
export function createEmpowerClient(
  apiUrl: string | undefined = process.env.EXPO_PUBLIC_EMPOWER_API_URL,
): EmpowerClient {
  return apiUrl ? createHttpEmpowerClient(apiUrl) : createMockEmpowerClient();
}
