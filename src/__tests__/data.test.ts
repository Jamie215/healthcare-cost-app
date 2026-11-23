import { ONTARIO_HOSPITALS } from '@/data/hospitals';
import { MEDICATION_SUGGESTIONS } from '@/data/medications';
import { searchHospitals, searchMedications } from '@/data/search';
import { formatCents, summarizeCosts, visitTotalCents } from '@/domain/costs';
import type { Visit } from '@/domain/visit';

describe('ported prototype data', () => {
  it('keeps the 51 Ontario hospitals and 25 medications', () => {
    expect(ONTARIO_HOSPITALS).toHaveLength(51);
    expect(MEDICATION_SUGGESTIONS).toHaveLength(25);
  });
});

describe('searchHospitals', () => {
  it('waits for two characters', () => {
    expect(searchHospitals('t')).toEqual([]);
  });

  it('matches names, cities and aliases', () => {
    expect(searchHospitals('toronto general')[0]?.name).toBe('Toronto General Hospital');
    expect(searchHospitals('UHN TWH')[0]?.name).toBe('Toronto Western Hospital');
    expect(searchHospitals('vaughan').map((h) => h.name)).toContain('Cortellucci Vaughan Hospital');
  });
});

describe('searchMedications', () => {
  it('filters by brand or generic name', () => {
    expect(searchMedications('advil')).toEqual(['Ibuprofen (Advil)']);
    expect(searchMedications('methotrexate')).toEqual(['Rheumatrex (Methotrexate)']);
  });
});

describe('summarizeCosts', () => {
  const visit = (cents: number[], hours?: number): Visit => ({
    id: String(Math.random()),
    category: 'primary',
    visitType: 'Family Doctor',
    date: '2026-11-01',
    costCoverage: 'OHIP',
    timeOffWorkHours: hours,
    expenses: cents.map((amountCents) => ({ type: 'Parking', amountCents })),
    createdAt: '',
  });

  it('adds expenses and hours off work', () => {
    expect(summarizeCosts([visit([1250, 400]), visit([], 3)])).toEqual({
      totalExpenseCents: 1650,
      visitCount: 2,
      hoursOffWork: 3,
    });
  });

  it('adds hours exactly, without floating-point noise', () => {
    // In plain JavaScript, 0.1 + 0.2 is 0.30000000000000004.
    expect(summarizeCosts([visit([], 0.1), visit([], 0.2)]).hoursOffWork).toBe(0.3);
  });

  it('totals and formats cents', () => {
    expect(visitTotalCents(visit([10, 20]))).toBe(30);
    expect(formatCents(1250)).toBe('$12.50');
    expect(formatCents(30)).toBe('$0.30');
  });
});
