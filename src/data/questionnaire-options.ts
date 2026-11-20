// Option lists from prototype/questionnaires.js. The prototype marks these as defaults
// pending confirmation against the live Figma component variants.

export const EMPLOYMENT_OPTIONS = [
  'Employed full-time',
  'Employed part-time',
  'Self-employed',
  'Unemployed',
  'Retired',
  'Student',
  'Homemaker',
  'Unable to work',
  'Other',
] as const;

export const INTAKE_EMPLOYMENT_OPTIONS = [
  'Employed full-time',
  'Employed part-time',
  'Self-employed',
  'Homemaking',
  'Student',
  'Volunteer',
  'Social Assistance',
  'WSIB',
  'Disability',
  'Litigation',
  'Temporary sick leave',
  'Accident Insurance',
  'Other',
] as const;

export const INCOME_OPTIONS = [
  'Less than $20,000',
  '$20,000-$39,999',
  '$40,000-$59,999',
  '$60,000-$79,999',
  '$80,000-$100,000',
  'More than $100,000',
  'Prefer not to answer',
] as const;
