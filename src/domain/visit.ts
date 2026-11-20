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

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a date as YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Enter a valid date');

const yesNo = z.enum(['yes', 'no'], { error: 'Choose Yes or No' });

/** Parses a non-negative number from a text field. Empty text is "not answered", never zero. */
const nonNegativeNumber = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((s) => /^\d+(\.\d+)?$/.test(s), 'Enter a number of 0 or more')
    .transform(Number);

export const expenseRowSchema = z.object({
  type: z.enum(EXPENSE_TYPES, { error: 'Select an expense type' }),
  amount: nonNegativeNumber('Enter the cost'),
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
    const check = (schema: z.ZodType, value: unknown, path: (string | number)[]) => {
      const r = schema.safeParse(value);
      if (!r.success) ctx.addIssue({ code: 'custom', path, message: r.error.issues[0]!.message });
    };
    const oneOf = (options: readonly string[], message: string) =>
      z.string({ error: message }).refine((s) => options.includes(s), message);

    check(oneOf(VISIT_CATEGORIES[v.category].types, 'Select the type of visit'), v.visitType, [
      'visitType',
    ]);
    check(isoDate, v.date ?? '', ['date']);
    if (v.category === 'hospital') {
      check(z.string().trim().min(1, 'Enter the name of the hospital'), v.hospitalName ?? '', [
        'hospitalName',
      ]);
    }
    check(oneOf(COST_COVERAGE, 'Select who paid for the visit'), v.costCoverage, ['costCoverage']);

    if (EMPLOYMENT_QUESTION_CATEGORIES.includes(v.category)) {
      check(yesNo, v.timeOffWork, ['timeOffWork']);
      if (v.timeOffWork === 'yes') {
        check(nonNegativeNumber('Enter the hours'), v.timeOffWorkHours ?? '', ['timeOffWorkHours']);
      }
    }
    if (REFERRAL_CATEGORIES.includes(v.category)) {
      check(yesNo, v.referred, ['referred']);
      if (v.referred === 'yes') {
        check(oneOf(TESTS_AND_PROCEDURES, 'Select the test or procedure'), v.referredFor, [
          'referredFor',
        ]);
        check(isoDate, v.appointmentDate ?? '', ['appointmentDate']);
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

export type Expense = z.output<typeof expenseRowSchema>;

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
    timeOffWorkHours: v.timeOffWork === 'yes' ? Number(v.timeOffWorkHours) : undefined,
    referral:
      v.referred === 'yes'
        ? { test: v.referredFor ?? '', appointmentDate: v.appointmentDate ?? '' }
        : undefined,
    expenses: v.hadExpenses === 'yes' ? v.expenses.map((e) => expenseRowSchema.parse(e)) : [],
  };
}
