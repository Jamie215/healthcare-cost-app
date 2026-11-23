import { render, screen } from '@testing-library/react-native';

import { createMockEmpowerClient, EmpowerProvider, type EmpowerClient } from '@/api/empower';
import { VisitsProvider } from '@/api/visits';
import Home from '@/app/index';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

async function renderHome(client: EmpowerClient) {
  await render(
    <EmpowerProvider client={client}>
      <VisitsProvider>
        <Home />
      </VisitsProvider>
    </EmpowerProvider>,
  );
}

describe('Home', () => {
  it('shows the empty state when there are no entries', async () => {
    await renderHome(createMockEmpowerClient());
    expect(await screen.findByText(/No entries yet/)).toBeOnTheScreen();
  });

  it('says when saved entries could not be shown', async () => {
    const client: EmpowerClient = {
      ...createMockEmpowerClient(),
      listVisits: async () => ({ visits: [], unreadable: 2 }),
    };
    await renderHome(client);
    expect(
      await screen.findByText(/2 saved entries couldn't be shown in the app\. They're still saved/),
    ).toBeOnTheScreen();
  });

  it('shows only the error, not the empty state, when loading fails', async () => {
    const client: EmpowerClient = {
      ...createMockEmpowerClient(),
      listVisits: () => Promise.reject(new Error('Could not reach EmPOWER')),
    };
    await renderHome(client);
    expect(await screen.findByText('Could not reach EmPOWER')).toBeOnTheScreen();
    expect(screen.queryByText(/No entries yet/)).not.toBeOnTheScreen();
  });
});
