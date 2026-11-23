import { createHttpEmpowerClient } from '@/api/empower/http-client';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, json: async () => [] });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

const requestedUrl = () => String(fetchMock.mock.calls[0]![0]);

describe('HTTP EmPOWER client', () => {
  it('keeps the base path of the API URL', async () => {
    await createHttpEmpowerClient('https://example.org/api/v1').listVisits();
    expect(requestedUrl()).toBe('https://example.org/api/v1/visits');
  });

  it('handles a trailing slash on the API URL', async () => {
    await createHttpEmpowerClient('https://example.org/api/v1/').listVisits();
    expect(requestedUrl()).toBe('https://example.org/api/v1/visits');
  });

  it('works with an API URL that has no path', async () => {
    await createHttpEmpowerClient('https://example.org').deleteVisit('a/b');
    expect(requestedUrl()).toBe('https://example.org/visits/a%2Fb');
  });
});

// Fictional record, as the server would send it.
const record = {
  id: 'visit-1',
  category: 'pharmacy',
  visitType: 'Pharmacy',
  date: '2026-11-02',
  costCoverage: 'Out of pocket',
  expenses: [{ type: 'Parking', amountCents: 1250 }],
  createdAt: '2026-11-02T15:04:05.000Z',
};

const reply = (body: unknown, status = 200) =>
  fetchMock.mockResolvedValue({ ok: status < 400, status, json: async () => body });

const client = () => createHttpEmpowerClient('https://example.org');

describe('checking EmPOWER replies', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('accepts readable visits', async () => {
    reply([record]);
    expect(await client().listVisits()).toEqual({ visits: [record], unreadable: 0 });
  });

  it('skips an unreadable visit, counts it, and keeps the others', async () => {
    const amountAsText = {
      ...record,
      id: 'visit-2',
      expenses: [{ type: 'Parking', amountCents: '1250' }],
    };
    reply([record, amountAsText]);
    expect(await client().listVisits()).toEqual({ visits: [record], unreadable: 1 });
  });

  it('tells developers which field was wrong, without the value', async () => {
    reply([{ ...record, expenses: [{ type: 'Parking', amountCents: 'SECRET-12.50' }] }]);
    await client().listVisits();
    const logged = JSON.stringify(warn.mock.calls);
    expect(logged).toContain('expenses.0.amountCents');
    expect(logged).not.toContain('SECRET');
  });

  it('rejects a reply that is not a list', async () => {
    reply({ visits: [record] });
    await expect(client().listVisits()).rejects.toMatchObject({
      name: 'EmpowerError',
      message: expect.stringContaining("doesn't understand"),
    });
  });

  it('rejects a reply that is not JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    });
    await expect(client().listVisits()).rejects.toMatchObject({ name: 'EmpowerError' });
  });

  it('warns against saving twice when the reply to a save is unreadable', async () => {
    reply({ ...record, id: undefined });
    const { id, createdAt, ...newVisit } = record;
    await expect(client().createVisit(newVisit as never)).rejects.toMatchObject({
      message: expect.stringContaining('Check Recent entries before saving it again'),
      details: ['id: Invalid input: expected string, received undefined'],
    });
  });

  it('checks the sign-in reply', async () => {
    reply({ participant: { id: 'p-1', displayName: 'Demo' } }); // no access token
    await expect(client().signIn({ username: 'demo', password: 'demo' })).rejects.toMatchObject({
      details: [expect.stringContaining('accessToken')],
    });
  });
});

describe('slow or missing connection', () => {
  afterEach(() => jest.useRealTimers());

  // A server that never answers: the request only ends when it is cancelled.
  const neverAnswers = () =>
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) =>
          init.signal!.addEventListener('abort', () =>
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })),
          ),
        ),
    );

  it('gives up after the timeout with a plain message', async () => {
    jest.useFakeTimers();
    neverAnswers();
    const result = expect(
      createHttpEmpowerClient('https://example.org', { timeoutMs: 5_000 }).listVisits(),
    ).rejects.toMatchObject({
      name: 'EmpowerError',
      message: expect.stringContaining('took too long'),
    });
    await jest.advanceTimersByTimeAsync(5_000);
    await result;
  });

  it('does not give up early', async () => {
    jest.useFakeTimers();
    neverAnswers();
    let settled = false;
    createHttpEmpowerClient('https://example.org', { timeoutMs: 5_000 })
      .listVisits()
      .catch(() => {})
      .finally(() => (settled = true));
    await jest.advanceTimersByTimeAsync(4_999);
    expect(settled).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    expect(settled).toBe(true);
  });

  it('explains a missing connection in plain words', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(client().listVisits()).rejects.toMatchObject({
      message: expect.stringContaining("Couldn't reach EmPOWER"),
    });
  });

  it('stops the timer once a reply arrives', async () => {
    jest.useFakeTimers();
    reply([]);
    await client().listVisits();
    expect(jest.getTimerCount()).toBe(0);
  });
});
