import { z } from 'zod';

import {
  COST_COVERAGE,
  EMPLOYMENT_QUESTION_CATEGORIES,
  EXPENSE_TYPES,
  REFERRAL_CATEGORIES,
  TESTS_AND_PROCEDURES,
  VISIT_CATEGORIES,
  VISIT_CATEGORY_KEYS,
  type VisitCategory,
} from '@/data/visit-types';

import { parseHundredths } from './number-input';

/**
 * True when YYYY-MM-DD names a real calendar day. `Date.parse` alone is not enough: it
 * rolls impossible days over (2026-02-30 becomes 2 March), so we build the date and check
 * the year, month and day come back unchanged.
 */
const isRealDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a date as YYYY-MM-DD')
  .refine(isRealDate, 'Enter a valid date');

/**
 * Today's date as YYYY-MM-DD in the phone's own time zone. Not `toISOString()`, which uses
 * UTC: in Toronto, UTC is already tomorrow after 7 pm, so a UTC "today" would let
 * tomorrow's date through every evening.
 */
export function localToday(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// YYYY-MM-DD strings sort in date order, so dates can be compared as plain text.
const visitDate = isoDate.refine((s) => s <= localToday(), "The visit date can't be in the future");

const yesNo = z.enum(['yes', 'no'], { error: 'Choose Yes or No' });

/**
 * Parses a non-negative number with at most two decimal places from a text field, as whole
 * hundredths (see `parseHundredths`): "12.50", "12,5", "12." and ".5" are fine, "12.505" is
 * not. Empty text is "not answered", never zero.
 */
const hundredths = (emptyMessage: string, formatMessage: string) =>
  z
    .string()
    .trim()
    .min(1, emptyMessage)
    .transform((s, ctx) => {
      const value = parseHundredths(s);
      if (value === null) {
        ctx.addIssue({ code: 'custom', message: formatMessage });
        return z.NEVER;
      }
      return value;
    });

/** One expense row as typed. `amount` parses to whole cents: "12.50" → 1250. */
export const expenseRowSchema = z.object({
  type: z.enum(EXPENSE_TYPES, { error: 'Select an expense type' }),
  amount: hundredths('Enter the cost', 'Enter an amount like 12.50'),
});

const optionalText = z.string().optional();

/**
 * What the participant enters on the visit form. All visible questions are required;
 * hidden follow-ups (answered "No") are ignored, matching the prototype's rules.
 *
 * The object shape only checks types (everything may be unanswered) and every
 * requirement lives in `superRefine`, so a single submit reports every unanswered
 * question at once. Zod skips refinements when the base shape fails.
 */
export const visitFormSchema = z
  .object({
    category: z.enum(VISIT_CATEGORY_KEYS as [VisitCategory, ...VisitCategory[]]),
    visitType: optionalText,
    date: optionalText,
    hospitalName: optionalText,
    costCoverage: z.enum(COST_COVERAGE).optional(),
    timeOffWork: z.enum(['yes', 'no']).optional(),
    timeOffWorkHours: optionalText,
    referred: z.enum(['yes', 'no']).optional(),
    referredFor: optionalText,
    appointmentDate: optionalText,
    hadExpenses: z.enum(['yes', 'no']).optional(),
    expenses: z.array(z.object({ type: z.string(), amount: z.string() })).default([]),
  })
  .superRefine((v, ctx) => {
    /** Reports only the first problem for a field, so each question shows one message. */
    /** Returns whether the value passed, so later checks can build on it. */
    const check = (schema: z.ZodType, value: unknown, path: (string | number)[]) => {
      const r = schema.safeParse(value);
      if (!r.success) ctx.addIssue({ code: 'custom', path, message: r.error.issues[0]!.message });
      return r.success;
    };
    const oneOf = (options: readonly string[], message: string) =>
      z.string({ error: message }).refine((s) => options.includes(s), message);

    check(oneOf(VISIT_CATEGORIES[v.category].types, 'Select the type of visit'), v.visitType, [
      'visitType',
    ]);
    const dateOk = check(visitDate, v.date ?? '', ['date']);
    if (v.category === 'hospital') {
      check(z.string().trim().min(1, 'Enter the name of the hospital'), v.hospitalName ?? '', [
        'hospitalName',
      ]);
    }
    check(oneOf(COST_COVERAGE, 'Select who paid for the visit'), v.costCoverage, ['costCoverage']);

    if (EMPLOYMENT_QUESTION_CATEGORIES.includes(v.category)) {
      check(yesNo, v.timeOffWork, ['timeOffWork']);
      if (v.timeOffWork === 'yes') {
        check(
          hundredths('Enter the hours', 'Enter hours like 2 or 1.5'),
          v.timeOffWorkHours ?? '',
          ['timeOffWorkHours'],
        );
      }
    }
    if (REFERRAL_CATEGORIES.includes(v.category)) {
      check(yesNo, v.referred, ['referred']);
      if (v.referred === 'yes') {
        check(oneOf(TESTS_AND_PROCEDURES, 'Select the test or procedure'), v.referredFor, [
          'referredFor',
        ]);
        // The appointment may be past or future (visits are often recorded later), but not
        // before the visit that led to the referral.
        const appointmentOk = check(isoDate, v.appointmentDate ?? '', ['appointmentDate']);
        if (dateOk && appointmentOk && v.appointmentDate! < v.date!) {
          ctx.addIssue({
            code: 'custom',
            path: ['appointmentDate'],
            message: "The appointment can't be before the visit",
          });
        }
      }
    }
    check(yesNo, v.hadExpenses, ['hadExpenses']);
    if (v.hadExpenses === 'yes') {
      if (v.expenses.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['expenses'], message: 'Add at least one expense' });
      }
      v.expenses.forEach((row, i) => {
        check(expenseRowSchema.shape.type, row.type, ['expenses', i, 'type']);
        check(expenseRowSchema.shape.amount, row.amount, ['expenses', i, 'amount']);
      });
    }
  });

export type VisitFormValues = z.input<typeof visitFormSchema>;

/**
 * A saved expense. Money is stored as a whole number of cents (12.50 dollars is 1250), so
 * totals are exact and the unit is clear to anyone reading exported data.
 */
export type Expense = {
  type: (typeof EXPENSE_TYPES)[number];
  amountCents: number;
};

/** A saved visit, as stored by the EmPOWER API (or the mock). */
export type Visit = {
  id: string;
  category: VisitCategory;
  visitType: string;
  date: string;
  hospitalName?: string;
  costCoverage: (typeof COST_COVERAGE)[number];
  timeOffWorkHours?: number;
  referral?: { test: string; appointmentDate: string };
  expenses: Expense[];
  createdAt: string;
};

export type NewVisit = Omit<Visit, 'id' | 'createdAt'>;

/** Blank form. Questions start unanswered (no Yes/No preselected), as in the prototype. */
export function emptyVisitForm(category: VisitCategory): Partial<VisitFormValues> {
  const types = VISIT_CATEGORIES[category].types;
  return {
    category,
    visitType: types.length === 1 ? types[0] : '',
    date: '',
    hospitalName: '',
    timeOffWorkHours: '',
    referredFor: '',
    appointmentDate: '',
    expenses: [],
  };
}

/** Converts validated form values to the record we save. Hidden follow-ups are dropped. */
export function toNewVisit(values: VisitFormValues): NewVisit {
  const v = visitFormSchema.parse(values);
  return {
    category: v.category,
    visitType: v.visitType!,
    date: v.date!,
    hospitalName: v.category === 'hospital' ? v.hospitalName : undefined,
    costCoverage: v.costCoverage!,
    timeOffWorkHours:
      v.timeOffWork === 'yes' ? parseHundredths(v.timeOffWorkHours ?? '')! / 100 : undefined,
    referral:
      v.referred === 'yes'
        ? { test: v.referredFor ?? '', appointmentDate: v.appointmentDate ?? '' }
        : undefined,
    expenses:
      v.hadExpenses === 'yes'
        ? v.expenses.map((e) => {
            const row = expenseRowSchema.parse(e);
            return { type: row.type, amountCents: row.amount };
          })
        : [],
  };
}
