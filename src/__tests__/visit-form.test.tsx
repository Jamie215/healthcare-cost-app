import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { createMockEmpowerClient, EmpowerProvider, type EmpowerClient } from '@/api/empower';
import { VisitsProvider } from '@/api/visits';
import { VisitForm } from '@/components/visit-form';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), dismissTo: jest.fn() } }));

async function renderForm(client: EmpowerClient, onSaved = jest.fn()) {
  await render(
    <EmpowerProvider client={client}>
      <VisitsProvider>
        <VisitForm category="pharmacy" onSaved={onSaved} />
      </VisitsProvider>
    </EmpowerProvider>,
  );
  return onSaved;
}

describe('VisitForm', () => {
  it('shows required-answer errors and does not save', async () => {
    const client = createMockEmpowerClient();
    const onSaved = await renderForm(client);
    await fireEvent.press(screen.getByRole('button', { name: 'Save visit' }));
    expect(await screen.findByText('Enter a date as YYYY-MM-DD')).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
    expect(await client.listVisits()).toEqual([]);
  });

  it('reveals expense rows only after Yes, and saves the visit', async () => {
    const client = createMockEmpowerClient();
    const onSaved = await renderForm(client);

    await fireEvent.changeText(screen.getByLabelText('Date of visit'), '2026-11-03');
    await fireEvent.press(screen.getByText('Out of pocket'));
    expect(screen.queryByText('Add expense')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Yes'));
    await fireEvent.press(screen.getByText('Add expense'));
    await fireEvent.press(screen.getByText('Parking'));
    // A French-language keypad types a comma; it must still save as $12.50.
    await fireEvent.changeText(screen.getByLabelText('Expense 1 cost'), '12,5');
    await fireEvent.press(screen.getByRole('button', { name: 'Save visit' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [saved] = await client.listVisits();
    expect(saved).toMatchObject({
      category: 'pharmacy',
      costCoverage: 'Out of pocket',
      expenses: [{ type: 'Parking', amountCents: 1250 }],
    });
  });
});
