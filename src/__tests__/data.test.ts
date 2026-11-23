import { ONTARIO_HOSPITALS } from '@/data/hospitals';
import { MEDICATION_SUGGESTIONS } from '@/data/medications';
import { searchHospitals, searchMedications } from '@/data/search';
import { summarizeCosts, visitTotal } from '@/domain/costs';
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
  const visit = (amounts: number[], hours?: number): Visit => ({
    id: String(Math.random()),
    category: 'primary',
    visitType: 'Family Doctor',
    date: '2026-11-01',
    costCoverage: 'OHIP',
    timeOffWorkHours: hours,
    expenses: amounts.map((amount) => ({ type: 'Parking', amount })),
    createdAt: '',
  });

  it('adds expenses and hours off work', () => {
    expect(summarizeCosts([visit([12.5, 4]), visit([], 3)])).toEqual({
      totalExpenses: 16.5,
      visitCount: 2,
      hoursOffWork: 3,
    });
  });

  it('adds decimals exactly, without floating-point noise', () => {
    // In plain JavaScript, 0.1 + 0.2 is 0.30000000000000004.
    expect(summarizeCosts([visit([0.1], 0.1), visit([0.2], 0.2)])).toMatchObject({
      totalExpenses: 0.3,
      hoursOffWork: 0.3,
    });
    expect(visitTotal(visit([0.1, 0.2]))).toBe(0.3);
  });
});
