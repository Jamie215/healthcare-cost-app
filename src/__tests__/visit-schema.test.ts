import { emptyVisitForm, toNewVisit, visitFormSchema, type VisitFormValues } from '@/domain/visit';

const base = (overrides: Partial<VisitFormValues> = {}): VisitFormValues =>
  ({
    ...emptyVisitForm('primary'),
    visitType: 'Family Doctor',
    date: '2026-11-02',
    costCoverage: 'OHIP',
    timeOffWork: 'no',
    referred: 'no',
    hadExpenses: 'no',
    ...overrides,
  }) as VisitFormValues;

const errorPaths = (values: VisitFormValues) => {
  const r = visitFormSchema.safeParse(values);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
};

describe('visit form rules', () => {
  it('accepts a complete family doctor visit', () => {
    expect(errorPaths(base())).toEqual([]);
  });

  it('requires every visible question', () => {
    const paths = errorPaths(emptyVisitForm('primary') as VisitFormValues);
    expect(paths).toEqual(
      expect.arrayContaining(['date', 'costCoverage', 'hadExpenses', 'timeOffWork', 'referred']),
    );
  });

  it('only requires follow-ups after Yes', () => {
    expect(errorPaths(base({ timeOffWork: 'yes' }))).toContain('timeOffWorkHours');
    expect(errorPaths(base({ referred: 'yes' }))).toEqual(
      expect.arrayContaining(['referredFor', 'appointmentDate']),
    );
    expect(errorPaths(base({ hadExpenses: 'yes' }))).toContain('expenses');
  });

  it('does not ask pharmacy visits about paid employment', () => {
    const pharmacy = {
      ...emptyVisitForm('pharmacy'),
      date: '2026-11-02',
      costCoverage: 'Out of pocket',
      hadExpenses: 'no',
    } as VisitFormValues;
    expect(errorPaths(pharmacy)).toEqual([]);
  });

  it('requires a hospital name for hospital visits', () => {
    const hospital = {
      ...emptyVisitForm('hospital'),
      visitType: 'Hospital',
      date: '2026-11-02',
      costCoverage: 'OHIP',
      timeOffWork: 'no',
      hadExpenses: 'no',
    } as VisitFormValues;
    expect(errorPaths(hospital)).toContain('hospitalName');
  });

  it('treats an empty cost as unanswered, not zero', () => {
    const values = base({ hadExpenses: 'yes', expenses: [{ type: 'Parking', amount: '' }] });
    expect(errorPaths(values)).toContain('expenses.0.amount');
    const zero = base({ hadExpenses: 'yes', expenses: [{ type: 'Parking', amount: '0' }] });
    expect(errorPaths(zero)).toEqual([]);
  });

  it('rejects dates that are not on the calendar', () => {
    for (const date of ['2026-02-30', '2026-02-31', '2026-04-31', '2026-13-01', '2026-00-10']) {
      expect(errorPaths(base({ date }))).toContain('date');
    }
    expect(errorPaths(base({ date: '2024-02-29' }))).toEqual([]); // leap year
    expect(errorPaths(base({ date: '2025-02-29' }))).toContain('date');
  });

  it('accepts amounts with up to two decimal places', () => {
    const withAmount = (amount: string) =>
      errorPaths(base({ hadExpenses: 'yes', expenses: [{ type: 'Parking', amount }] }));
    for (const amount of ['12', '12.5', '12.50', '12.', '.5', ' 3 ', '12,50', ',5']) {
      expect(withAmount(amount)).toEqual([]);
    }
    for (const amount of ['12.505', '1,000', '$12', '-1', '.', 'abc', '1.2.3']) {
      expect(withAmount(amount)).toContain('expenses.0.amount');
    }
    expect(errorPaths(base({ timeOffWork: 'yes', timeOffWorkHours: '1.5' }))).toEqual([]);
    expect(errorPaths(base({ timeOffWork: 'yes', timeOffWorkHours: '1.255' }))).toContain(
      'timeOffWorkHours',
    );
  });

  it('saves comma decimals as numbers', () => {
    const saved = toNewVisit(
      base({
        timeOffWork: 'yes',
        timeOffWorkHours: '1,5',
        hadExpenses: 'yes',
        expenses: [{ type: 'Parking', amount: '12,5' }],
      }),
    );
    expect(saved.timeOffWorkHours).toBe(1.5);
    expect(saved.expenses).toEqual([{ type: 'Parking', amountCents: 1250 }]);
  });

  it('drops hidden follow-ups when saving', () => {
    const saved = toNewVisit(
      base({
        timeOffWork: 'no',
        timeOffWorkHours: '3',
        hadExpenses: 'no',
        expenses: [{ type: 'Meal', amount: '8' }],
      }),
    );
    expect(saved.timeOffWorkHours).toBeUndefined();
    expect(saved.expenses).toEqual([]);
  });

  it('saves expense amounts as whole cents', () => {
    const saved = toNewVisit(
      base({
        hadExpenses: 'yes',
        expenses: [
          { type: 'Parking', amount: '12.50' },
          { type: 'Meal', amount: '4' },
        ],
      }),
    );
    expect(saved.expenses).toEqual([
      { type: 'Parking', amountCents: 1250 },
      { type: 'Meal', amountCents: 400 },
    ]);
  });
});
