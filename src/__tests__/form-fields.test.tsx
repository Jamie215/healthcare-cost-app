import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/button';
import {
  FormChoice,
  FormDecimalField,
  FormMoneyField,
  FormTextField,
  FormYesNo,
} from '@/components/form-fields';

const COLOURS = ['Red', 'Blue'] as const;

const schema = z.object({
  name: z.string().min(1, 'Enter a name'),
  colour: z.enum(COLOURS, { error: 'Pick a colour' }),
  agree: z.enum(['yes', 'no'], { error: 'Choose Yes or No' }),
  hours: z.string().min(1, 'Enter the hours'),
  cost: z.string().min(1, 'Enter the cost'),
});
type Values = z.input<typeof schema>;

function TestForm({ onValid }: { onValid: (values: Values) => void }) {
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', hours: '', cost: '' },
  });
  return (
    <>
      <FormTextField control={control} name="name" label="Name" />
      <FormChoice control={control} name="colour" label="Colour" options={COLOURS} />
      <FormYesNo control={control} name="agree" label="Agree?" />
      <FormDecimalField control={control} name="hours" label="Hours" />
      <FormMoneyField control={control} name="cost" label="Cost" />
      <Button label="Submit" onPress={handleSubmit(onValid)} />
    </>
  );
}

// Type check only, never rendered: a Yes/No field must not point at a text answer.
function WrongField() {
  const { control } = useForm<Values>();
  // @ts-expect-error "name" holds text, not 'yes' | 'no'
  return <FormYesNo control={control} name="name" label="Wrong" />;
}
void WrongField;

describe('form fields', () => {
  it("shows each field's own error and does not submit", async () => {
    const onValid = jest.fn();
    await render(<TestForm onValid={onValid} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Submit' }));
    for (const message of [
      'Enter a name',
      'Pick a colour',
      'Choose Yes or No',
      'Enter the hours',
      'Enter the cost',
    ]) {
      expect(await screen.findByText(message)).toBeOnTheScreen();
    }
    expect(onValid).not.toHaveBeenCalled();
  });

  it('saves what is entered into the form', async () => {
    const onValid = jest.fn();
    await render(<TestForm onValid={onValid} />);
    await fireEvent.changeText(screen.getByLabelText('Name'), 'Sam');
    await fireEvent.press(screen.getByText('Blue'));
    await fireEvent.press(screen.getByText('Yes'));
    await fireEvent.changeText(screen.getByLabelText('Hours'), '1,5');
    await fireEvent.changeText(screen.getByLabelText('Cost'), '12.5');
    await fireEvent(screen.getByLabelText('Cost'), 'blur');
    await fireEvent.press(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(onValid).toHaveBeenCalled());
    expect(onValid.mock.calls[0]![0]).toEqual({
      name: 'Sam',
      colour: 'Blue',
      agree: 'yes',
      hours: '1.5',
      cost: '12.50',
    });
  });

  it('shows a selected choice', async () => {
    await render(<TestForm onValid={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Blue' })).not.toBeSelected();
    await fireEvent.press(screen.getByText('Blue'));
    expect(screen.getByRole('radio', { name: 'Blue' })).toBeSelected();
  });
});
