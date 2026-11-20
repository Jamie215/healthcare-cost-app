import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, space } from '@/theme/tokens';

import { Text } from './text';

export function Question({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.question}>
      <Text variant="label">{label}</Text>
      {children}
      {error ? (
        <Text variant="error" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function TextField({
  label,
  error,
  suffix,
  onFocus,
  onBlur,
  ...input
}: TextInputProps & { label: string; error?: string; suffix?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <Question label={label} error={error}>
      <View
        style={[styles.input, focused && styles.inputFocused, error ? styles.inputError : null]}
      >
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.muted}
          style={styles.textInput}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...input}
        />
        {suffix ? <Text variant="muted">{suffix}</Text> : null}
      </View>
    </Question>
  );
}

/** Single-choice list. Used for Yes/No questions and short option lists. */
export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  getLabel = (o) => o,
}: {
  label: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
  getLabel?: (option: T) => string;
}) {
  return (
    <Question label={label} error={error}>
      <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const selected = o === value;
          return (
            <Pressable
              key={o}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(o)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={selected ? styles.chipTextSelected : undefined}>{getLabel(o)}</Text>
            </Pressable>
          );
        })}
      </View>
    </Question>
  );
}

const YES_NO = ['yes', 'no'] as const;

export function YesNo(props: {
  label: string;
  value: 'yes' | 'no' | undefined;
  onChange: (value: 'yes' | 'no') => void;
  error?: string;
}) {
  return <Choice {...props} options={YES_NO} getLabel={(o) => (o === 'yes' ? 'Yes' : 'No')} />;
}

const styles = StyleSheet.create({
  question: { gap: space[8] },
  input: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    paddingHorizontal: space[16],
  },
  // Active border from the prototype's Input component (#005586).
  inputFocused: { borderColor: colors.blue500 },
  inputError: { borderColor: colors.error },
  textInput: {
    flex: 1,
    minHeight: 41,
    fontFamily: 'Inter-400',
    fontSize: 14,
    color: colors.text,
    // The wrapper shows focus; drop the browser's default outline on web.
    outlineWidth: 0,
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: space[16],
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.blue500, backgroundColor: colors.blue500 },
  chipTextSelected: { color: colors.surface },
});
