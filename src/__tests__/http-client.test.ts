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
