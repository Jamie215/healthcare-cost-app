import { useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import { colors, radius, space } from '@/theme/tokens';

import { Text } from './text';

// The wrapper shows focus, so drop the browser's own focus outline on web. CSS needs
// outline-style: none here (outlineWidth: 0 alone leaves it), but React Native's types only
// list the native values (solid, dotted, dashed), hence the cast.
const webNoOutline = Platform.select({ web: { outlineStyle: 'none' } as unknown as TextStyle });

export function Question({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  /** A gentle note that does not block saving, such as "please check this amount". */
  hint?: string;
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
      ) : hint ? (
        <Text variant="muted" accessibilityLiveRegion="polite">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  /** Shown before the text, such as "$". */
  prefix?: string;
  /** Shown after the text, such as "CAD". */
  suffix?: string;
  /** Reaches the text box, so a form can focus it (React 19 passes `ref` as a normal prop). */
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function TextField({
  label,
  error,
  hint,
  prefix,
  suffix,
  onFocus,
  onBlur,
  ref,
  ...input
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Question label={label} error={error} hint={hint}>
      <View
        style={[styles.input, focused && styles.inputFocused, error ? styles.inputError : null]}
      >
        {prefix ? <Text variant="muted">{prefix}</Text> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.muted}
          style={[styles.textInput, webNoOutline]}
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
    gap: space[4],
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
