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

  it('converts expense amounts to numbers', () => {
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
      { type: 'Parking', amount: 12.5 },
      { type: 'Meal', amount: 4 },
    ]);
  });
});
