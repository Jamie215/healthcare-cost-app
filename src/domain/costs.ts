import type { Visit } from './visit';

export type CostSummary = {
  totalExpenses: number;
  visitCount: number;
  hoursOffWork: number;
};

/**
 * Home cost summary. Like the prototype, this only adds up related expenses.
 * Which categories and periods to show is still an open study decision (handoff 3.1).
 */
export function summarizeCosts(visits: readonly Visit[]): CostSummary {
  return visits.reduce<CostSummary>(
    (acc, v) => ({
      totalExpenses: acc.totalExpenses + v.expenses.reduce((s, e) => s + e.amount, 0),
      visitCount: acc.visitCount + 1,
      hoursOffWork: acc.hoursOffWork + (v.timeOffWorkHours ?? 0),
    }),
    { totalExpenses: 0, visitCount: 0, hoursOffWork: 0 },
  );
}

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
