import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, space } from '@/theme/tokens';

import { Text } from './text';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text variant="label" style={{ color: primary ? colors.surface : colors.blue500 }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radius.button,
    paddingHorizontal: space[16],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.blue500,
  },
  primary: { backgroundColor: colors.blue500 },
  secondary: { backgroundColor: colors.surface },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
});
