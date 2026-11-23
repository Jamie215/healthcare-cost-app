import type { Visit } from './visit';

export type CostSummary = {
  /** Related expenses, in whole cents. */
  totalExpenseCents: number;
  visitCount: number;
  hoursOffWork: number;
};

/**
 * Adds numbers that have at most two decimal places, such as hours, without floating-point
 * noise. Computers store decimals in binary, so 0.1 + 0.2 is 0.30000000000000004; summing
 * whole hundredths and dividing once at the end avoids that. Money needs no such care: it is
 * stored in whole cents, and whole numbers add up exactly.
 */
export const sumHundredths = (values: readonly number[]) =>
  values.reduce((sum, n) => sum + Math.round(n * 100), 0) / 100;

const sum = (values: readonly number[]) => values.reduce((total, n) => total + n, 0);

/** Total of one visit's related expenses, in cents. */
export const visitTotalCents = (visit: Visit) => sum(visit.expenses.map((e) => e.amountCents));

/**
 * Home cost summary. Like the prototype, this only adds up related expenses.
 * Which categories and periods to show is still an open study decision (handoff 3.1).
 */
export function summarizeCosts(visits: readonly Visit[]): CostSummary {
  return {
    totalExpenseCents: sum(visits.map(visitTotalCents)),
    visitCount: visits.length,
    hoursOffWork: sumHundredths(visits.map((v) => v.timeOffWorkHours ?? 0)),
  };
}

const currency = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' });

/** Formats whole cents for display: 1250 → "$12.50". */
export const formatCents = (cents: number) => currency.format(cents / 100);
