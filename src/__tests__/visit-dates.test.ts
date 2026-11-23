import { emptyVisitForm, localToday, visitFormSchema, type VisitFormValues } from '@/domain/visit';

// Tests run in Ontario time (jest/global-setup.js). Freeze "now" at 9:30 pm on 23 November
// 2026: it is already 24 November in UTC, exactly the case a UTC-based check gets wrong.
const EVENING = new Date('2026-11-24T02:30:00Z'); // 21:30 on 23 Nov in Toronto

beforeEach(() => jest.useFakeTimers({ now: EVENING }));
afterEach(() => jest.useRealTimers());

const form = (overrides: Partial<VisitFormValues>): VisitFormValues =>
  ({
    ...emptyVisitForm('primary'),
    visitType: 'Family Doctor',
    date: '2026-11-20',
    costCoverage: 'OHIP',
    timeOffWork: 'no',
    referred: 'no',
    hadExpenses: 'no',
    ...overrides,
  }) as VisitFormValues;

const errorsFor = (values: VisitFormValues, path: string) => {
  const r = visitFormSchema.safeParse(values);
  return r.success
    ? []
    : r.error.issues.filter((i) => i.path.join('.') === path).map((i) => i.message);
};

describe('localToday', () => {
  it("uses the phone's time zone, not UTC", () => {
    expect(EVENING.toISOString().slice(0, 10)).toBe('2026-11-24'); // UTC is already tomorrow
    expect(localToday()).toBe('2026-11-23');
  });
});

describe('visit date', () => {
  it('accepts today and earlier days', () => {
    expect(errorsFor(form({ date: '2026-11-23' }), 'date')).toEqual([]);
    expect(errorsFor(form({ date: '2025-01-01' }), 'date')).toEqual([]);
  });

  it('rejects a future date, including tomorrow in the evening', () => {
    expect(errorsFor(form({ date: '2026-11-24' }), 'date')).toEqual([
      "The visit date can't be in the future",
    ]);
    expect(errorsFor(form({ date: '2099-01-01' }), 'date')).toHaveLength(1);
  });
});

describe('referral appointment date', () => {
  const referral = (appointmentDate: string) =>
    form({ referred: 'yes', referredFor: 'X-ray', appointmentDate });

  it('may be in the past or the future, from the visit day on', () => {
    expect(errorsFor(referral('2026-11-20'), 'appointmentDate')).toEqual([]); // same day
    expect(errorsFor(referral('2026-11-22'), 'appointmentDate')).toEqual([]); // already happened
    expect(errorsFor(referral('2027-01-15'), 'appointmentDate')).toEqual([]); // upcoming
  });

  it('cannot be before the visit', () => {
    expect(errorsFor(referral('2026-11-19'), 'appointmentDate')).toEqual([
      "The appointment can't be before the visit",
    ]);
  });

  it('shows only the format error when the date is not valid', () => {
    expect(errorsFor(referral('2026-02-30'), 'appointmentDate')).toEqual(['Enter a valid date']);
  });
});
