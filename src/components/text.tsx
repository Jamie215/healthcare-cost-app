import { StyleSheet, Text as RNText, type TextProps } from 'react-native';

import { colors, fontSize } from '@/theme/tokens';

type Variant = 'body' | 'label' | 'muted' | 'title' | 'heading' | 'error';

export function Text({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  return <RNText {...props} style={[styles.base, styles[variant], style]} />;
}

const styles = StyleSheet.create({
  base: { fontFamily: 'Inter-400', fontSize: fontSize.body, color: colors.text },
  body: {},
  label: { fontFamily: 'Inter-500', fontSize: fontSize.label },
  muted: { color: colors.muted },
  title: { fontFamily: 'Inter-600', fontSize: fontSize.title },
  heading: { fontFamily: 'Inter-700', fontSize: fontSize.heading, color: colors.blue500 },
  error: { color: colors.error, fontSize: 13 },
});
