import { formatCents } from '@/domain/costs';
import {
  formatHundredths,
  LARGE_AMOUNT_CENTS,
  parseHundredths,
  sanitizeDecimalInput,
} from '@/domain/number-input';

import { TextField, type TextFieldProps } from './fields';

// TextInput's own `onChange` receives a native event; this field's `onChange` receives text.
type Props = Omit<
  TextFieldProps,
  'value' | 'onChange' | 'onChangeText' | 'inputMode' | 'keyboardType'
> & {
  value: string;
  onChange: (text: string) => void;
  /** Tidy to exactly two decimals when the participant leaves the field: "12.5" → "12.50". */
  fixedDecimals?: boolean;
  /** Show `largeHint` (without blocking) when the amount is above this many hundredths. */
  warnAbove?: number;
  largeHint?: string;
};

/**
 * Number field that only lets a valid amount in: digits, one decimal point and up to two
 * decimals. Opens the phone's decimal keypad. Its decimal key is a point or a comma
 * depending on the phone's language, so a typed comma becomes a point straight away.
 * An empty field stays empty ("not answered"), never 0.
 */
export function DecimalField({
  value,
  onChange,
  onBlur,
  fixedDecimals,
  warnAbove,
  largeHint,
  ...field
}: Props) {
  const parsed = parseHundredths(value);
  const hint = warnAbove != null && parsed != null && parsed > warnAbove ? largeHint : field.hint;
  return (
    <TextField
      {...field}
      hint={hint}
      value={value}
      inputMode="decimal"
      onChangeText={(text) => onChange(sanitizeDecimalInput(text))}
      onBlur={(e) => {
        if (parsed != null) {
          onChange(fixedDecimals ? formatHundredths(parsed) : String(parsed / 100));
        }
        onBlur?.(e);
      }}
    />
  );
}

/** Dollar amount: "$" before, "CAD" after, two decimals, and a check on large amounts. */
export function MoneyField(props: Omit<Props, 'prefix' | 'suffix' | 'fixedDecimals'>) {
  return (
    <DecimalField
      placeholder="0.00"
      warnAbove={LARGE_AMOUNT_CENTS}
      largeHint={`That's over ${formatCents(LARGE_AMOUNT_CENTS)}. Please check the amount.`}
      {...props}
      prefix="$"
      suffix="CAD"
      fixedDecimals
    />
  );
}
