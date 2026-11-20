// Visit categories and types, ported from the prototype (prototype/app.js `types`).

export const VISIT_CATEGORIES = {
  hospital: {
    label: 'Hospital or emergency care',
    types: ['Emergency Care', 'Hospital'],
  },
  primary: {
    label: 'Family doctor or walk-in clinic',
    types: ['Family Doctor', 'Walk-In Clinic'],
  },
  specialist: {
    label: 'Medical specialist',
    types: [
      'Allergist',
      'Cardiologist',
      'Ear, Nose & Throat (ENT) Specialist',
      'Gastroenterologist',
      'Hematologist',
      'Respirologist',
      'Surgeon',
    ],
  },
  rehab: {
    label: 'Rehabilitation',
    types: ['Chiropractor', 'Massage Therapist', 'Occupational Therapist', 'Physiotherapist'],
  },
  clinic: {
    label: 'Specialty clinic',
    types: ['Nutrition Clinic', 'Pain Management Clinic', 'Sleep Disorder Clinic'],
  },
  pharmacy: {
    label: 'Pharmacy',
    types: ['Pharmacy'],
  },
  other: {
    label: 'Other',
    types: [
      'Herbalist',
      'Home Care or Community Nurse (CCAC)',
      'Naturopath',
      'Psychologist',
      'Social Worker',
    ],
  },
} as const satisfies Record<string, { label: string; types: readonly string[] }>;

export type VisitCategory = keyof typeof VISIT_CATEGORIES;

export const VISIT_CATEGORY_KEYS = Object.keys(VISIT_CATEGORIES) as VisitCategory[];

export function isVisitCategory(value: unknown): value is VisitCategory {
  return typeof value === 'string' && value in VISIT_CATEGORIES;
}

/** Categories whose form asks whether the participant was referred for a test or procedure. */
export const REFERRAL_CATEGORIES: readonly VisitCategory[] = ['primary', 'specialist'];

/** Pharmacy visits skip the time-off-paid-employment question. */
export const EMPLOYMENT_QUESTION_CATEGORIES: readonly VisitCategory[] = VISIT_CATEGORY_KEYS.filter(
  (c) => c !== 'pharmacy',
);

export const COST_COVERAGE = ['OHIP', 'Private insurance', 'Out of pocket'] as const;

export const TESTS_AND_PROCEDURES = [
  'CBC or other blood test',
  'X-ray',
  'MRI',
  'CT scan',
  'Ultrasound',
  'Other',
] as const;

export const EXPENSE_TYPES = [
  'Parking',
  'Meal',
  'Gasoline',
  'Walking aids',
  'Accommodation',
  'Other',
] as const;
