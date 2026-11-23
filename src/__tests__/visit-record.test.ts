import {
  emptyVisitForm,
  newVisitSchema,
  toNewVisit,
  visitSchema,
  type VisitFormValues,
} from '@/domain/visit';

// Fictional record, as a server would send it.
const saved = {
  id: 'visit-1',
  category: 'primary',
  visitType: 'Family Doctor',
  date: '2026-11-02',
  costCoverage: 'OHIP',
  timeOffWorkHours: 1.5,
  referral: { test: 'X-ray', appointmentDate: '2026-11-10' },
  expenses: [{ type: 'Parking', amountCents: 1250 }],
  createdAt: '2026-11-02T15:04:05.000Z',
};

const problemsWith = (record: unknown) => {
  const r = visitSchema.safeParse(record);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
};

describe('saved visit schema', () => {
  it('accepts a complete saved visit', () => {
    expect(problemsWith(saved)).toEqual([]);
  });

  it('accepts a visit without the optional answers', () => {
    const { timeOffWorkHours, referral, ...minimal } = saved;
    expect(problemsWith({ ...minimal, expenses: [] })).toEqual([]);
  });

  it('rejects an amount sent as text or as dollars', () => {
    const withAmount = (amountCents: unknown) =>
      problemsWith({ ...saved, expenses: [{ type: 'Parking', amountCents }] });
    expect(withAmount('12.50')).toEqual(['expenses.0.amountCents']);
    expect(withAmount(12.5)).toEqual(['expenses.0.amountCents']); // not whole cents
    expect(withAmount(-100)).toEqual(['expenses.0.amountCents']);
  });

  it('rejects missing or impossible dates and unknown options', () => {
    const { date, ...noDate } = saved;
    expect(problemsWith(noDate)).toEqual(['date']);
    expect(problemsWith({ ...saved, date: '2026-02-30' })).toEqual(['date']);
    expect(problemsWith({ ...saved, category: 'dentist' })).toEqual(['category']);
    expect(problemsWith({ ...saved, costCoverage: 'Cash' })).toEqual(['costCoverage']);
  });

  it('drops unknown extra fields instead of rejecting them', () => {
    const r = visitSchema.parse({ ...saved, syncedAt: '2026-11-03' });
    expect(r).not.toHaveProperty('syncedAt');
  });
});

describe('toNewVisit', () => {
  it('always produces a record that fits the saved visit schema', () => {
    const values = {
      ...emptyVisitForm('primary'),
      visitType: 'Family Doctor',
      date: '2026-11-02',
      costCoverage: 'OHIP',
      timeOffWork: 'yes',
      timeOffWorkHours: '1,5',
      referred: 'yes',
      referredFor: 'X-ray',
      appointmentDate: '2026-11-10',
      hadExpenses: 'yes',
      expenses: [{ type: 'Parking', amount: '12,5' }],
    } as VisitFormValues;
    expect(newVisitSchema.safeParse(toNewVisit(values)).success).toBe(true);
  });
});
