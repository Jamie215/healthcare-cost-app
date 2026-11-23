import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, space } from '@/theme/tokens';

import { Text } from './text';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  /** Show a "Go back" control above the content. The app has no native header. */
  back?: boolean;
};

/** Scrolling page with a footer pinned to the bottom, matching the prototype's form layout. */
export function Screen({ children, footer, back }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            >
              <Text variant="label" style={styles.backText}>
                ‹ Go back
              </Text>
            </Pressable>
          ) : null}
          {children}
        </View>
      </ScrollView>
      {footer ? (
        <View style={styles.footer}>
          <View style={styles.column}>{footer}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  content: { padding: space[24], paddingBottom: space[32], alignItems: 'center' },
  // The prototype's reference width is 402px; cap content so web reviews look like the phone.
  column: { width: '100%', maxWidth: 402 - 2 * space[24], gap: space[24] },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.blue500 },
  pressed: { opacity: 0.6 },
  footer: {
    padding: space[16],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
});
