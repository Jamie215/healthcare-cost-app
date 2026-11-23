import type { Visit } from './visit';

export type CostSummary = {
  totalExpenses: number;
  visitCount: number;
  hoursOffWork: number;
};

/**
 * Adds numbers that have at most two decimal places (dollars and cents, or hours) without
 * floating-point noise. Computers store decimals in binary, so 0.1 + 0.2 is
 * 0.30000000000000004; summing whole hundredths and dividing once at the end avoids that.
 */
export const sumHundredths = (values: readonly number[]) =>
  values.reduce((sum, n) => sum + Math.round(n * 100), 0) / 100;

/** Total of one visit's related expenses. */
export const visitTotal = (visit: Visit) => sumHundredths(visit.expenses.map((e) => e.amount));

/**
 * Home cost summary. Like the prototype, this only adds up related expenses.
 * Which categories and periods to show is still an open study decision (handoff 3.1).
 */
export function summarizeCosts(visits: readonly Visit[]): CostSummary {
  return {
    totalExpenses: sumHundredths(visits.flatMap((v) => v.expenses.map((e) => e.amount))),
    visitCount: visits.length,
    hoursOffWork: sumHundredths(visits.map((v) => v.timeOffWorkHours ?? 0)),
  };
}

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
