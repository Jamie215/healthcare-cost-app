import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { DecimalField, MoneyField } from '@/components/decimal-field';

function Money({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <MoneyField label="Cost" value={value} onChange={setValue} />;
}

function Hours() {
  const [value, setValue] = useState('');
  return <DecimalField label="Hours" value={value} onChange={setValue} />;
}

const input = (label: string) => screen.getByLabelText(label);

describe('MoneyField', () => {
  it('turns a typed comma into a point and tidies to two decimals on leaving', async () => {
    await render(<Money />);
    await fireEvent.changeText(input('Cost'), '12,5');
    expect(input('Cost')).toHaveDisplayValue('12.5');
    await fireEvent(input('Cost'), 'blur');
    expect(input('Cost')).toHaveDisplayValue('12.50');
  });

  it('does not let invalid characters or a third decimal in', async () => {
    await render(<Money initial="12.50" />);
    await fireEvent.changeText(input('Cost'), '12.505');
    expect(input('Cost')).toHaveDisplayValue('12.50');
    await fireEvent.changeText(input('Cost'), '12.50a-');
    expect(input('Cost')).toHaveDisplayValue('12.50');
  });

  it('keeps an empty field empty, never 0.00', async () => {
    await render(<Money />);
    await fireEvent.changeText(input('Cost'), 'abc');
    await fireEvent(input('Cost'), 'blur');
    expect(input('Cost')).toHaveDisplayValue('');
  });

  it('asks to double-check a large amount without blocking', async () => {
    await render(<Money />);
    expect(screen.queryByText(/Please check the amount/)).not.toBeOnTheScreen();
    await fireEvent.changeText(input('Cost'), '10000.01');
    expect(screen.getByText(/Please check the amount/)).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });

  it('shows the currency around the amount', async () => {
    await render(<Money />);
    expect(screen.getByText('$')).toBeOnTheScreen();
    expect(screen.getByText('CAD')).toBeOnTheScreen();
  });
});

describe('DecimalField (hours)', () => {
  it('tidies a trailing or leading point on leaving', async () => {
    await render(<Hours />);
    await fireEvent.changeText(input('Hours'), '1.');
    await fireEvent(input('Hours'), 'blur');
    expect(input('Hours')).toHaveDisplayValue('1');
    await fireEvent.changeText(input('Hours'), ',5');
    await fireEvent(input('Hours'), 'blur');
    expect(input('Hours')).toHaveDisplayValue('0.5');
  });
});
