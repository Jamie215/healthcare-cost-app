import { createEmpowerClient, createMockEmpowerClient, EmpowerError } from '@/api/empower';
import type { NewVisit } from '@/domain/visit';

const visit: NewVisit = {
  category: 'pharmacy',
  visitType: 'Pharmacy',
  date: '2026-11-03',
  costCoverage: 'Out of pocket',
  expenses: [],
};

describe('mock EmPOWER client', () => {
  it('is used when no API URL is configured', async () => {
    const client = createEmpowerClient(undefined);
    expect(await client.getSession()).not.toBeNull();
  });

  it('saves and lists visits, newest first', async () => {
    const client = createMockEmpowerClient();
    await client.createVisit({ ...visit, date: '2026-10-01' });
    const saved = await client.createVisit(visit);
    expect(saved.id).toBeTruthy();
    expect((await client.listVisits()).map((v) => v.date)).toEqual(['2026-11-03', '2026-10-01']);
    await client.deleteVisit(saved.id);
    expect(await client.listVisits()).toHaveLength(1);
  });

  it('rejects data calls when signed out', async () => {
    const client = createMockEmpowerClient({ signedIn: false });
    await expect(client.listVisits()).rejects.toBeInstanceOf(EmpowerError);
    await client.signIn({ username: 'demo', password: 'demo' });
    await expect(client.listVisits()).resolves.toEqual([]);
  });
});
