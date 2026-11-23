import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form';

import { DecimalField, MoneyField, type DecimalFieldProps } from './decimal-field';
import { Choice, TextField, YesNo, type TextFieldProps } from './fields';

/**
 * Form-aware versions of the shared fields. Each one connects itself to a React Hook Form
 * form from `control` and `name`, and shows that field's own error, so a question on a
 * form is a few lines:
 *
 *   <FormChoice control={control} name="costCoverage" label="Who paid?" options={COST_COVERAGE} />
 *
 * `name` is checked by TypeScript against the form's fields, and only names whose value
 * fits the component are allowed (a Yes/No field cannot point at a text answer).
 * Validation rules stay in `src/domain/` (Zod); these components only display errors.
 * For a question that needs something unusual, use React Hook Form's `Controller` directly.
 */

type Connection<T extends FieldValues, V> = {
  control: Control<T>;
  name: FieldPathByValue<T, V>;
};

/** Props the form fills in, so callers cannot pass them by mistake. */
type FormManaged = 'value' | 'onChange' | 'onChangeText' | 'onBlur' | 'error';

function useFormField<T extends FieldValues, V>({ control, name }: Connection<T, V>) {
  // Taken apart here, not spread: the React Compiler's lint treats any object holding a `ref`
  // as a ref, and refs must not be read while rendering.
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  return {
    ref,
    // Safe: FieldPathByValue only allows names whose value is a V.
    value: value as V,
    onChange,
    onBlur,
    error: fieldState.error?.message,
  };
}

type Text = string | undefined;

export function FormTextField<T extends FieldValues>({
  control,
  name,
  ...props
}: Connection<T, Text> & Omit<TextFieldProps, FormManaged>) {
  const { ref, value, onChange, onBlur, error } = useFormField<T, Text>({ control, name });
  return (
    <TextField
      {...props}
      // Lets the form focus this field when it is the first unanswered question.
      ref={ref}
      value={value ?? ''}
      onChangeText={onChange}
      onBlur={onBlur}
      error={error}
    />
  );
}

export function FormDecimalField<T extends FieldValues>({
  control,
  name,
  ...props
}: Connection<T, Text> & Omit<DecimalFieldProps, FormManaged>) {
  const { ref, value, onChange, onBlur, error } = useFormField<T, Text>({ control, name });
  return (
    <DecimalField
      {...props}
      ref={ref}
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
    />
  );
}

export function FormMoneyField<T extends FieldValues>({
  control,
  name,
  ...props
}: Connection<T, Text> &
  Omit<DecimalFieldProps, FormManaged | 'prefix' | 'suffix' | 'fixedDecimals'>) {
  const { ref, value, onChange, onBlur, error } = useFormField<T, Text>({ control, name });
  return (
    <MoneyField
      {...props}
      ref={ref}
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
    />
  );
}

export function FormChoice<T extends FieldValues, O extends string>({
  control,
  name,
  label,
  options,
  getLabel,
}: Connection<T, Text> & {
  label: string;
  options: readonly O[];
  getLabel?: (option: O) => string;
}) {
  const { value, onChange, error } = useFormField<T, Text>({ control, name });
  return (
    <Choice
      label={label}
      options={options}
      // An answer that is not one of the options (such as "" for unanswered) shows as none.
      value={options.find((o) => o === value)}
      onChange={onChange}
      error={error}
      getLabel={getLabel}
    />
  );
}

type YesNoAnswer = 'yes' | 'no' | undefined;

export function FormYesNo<T extends FieldValues>({
  control,
  name,
  label,
}: Connection<T, YesNoAnswer> & { label: string }) {
  const { value, onChange, error } = useFormField<T, YesNoAnswer>({ control, name });
  return <YesNo label={label} value={value} onChange={onChange} error={error} />;
}
