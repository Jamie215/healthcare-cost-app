import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useVisits } from '@/api/visits';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { formatCurrency, summarizeCosts } from '@/domain/costs';
import { colors, fontSize, radius, space } from '@/theme/tokens';

export default function Home() {
  const { visits, loading, error } = useVisits();
  const summary = summarizeCosts(visits);

  return (
    <Screen footer={<Button label="Add a cost" onPress={() => router.push('/add-cost')} />}>
      <Text variant="heading">Your Healthcare Costs</Text>

      <View style={styles.card} accessibilityLabel="Cost summary">
        <Text variant="muted">Related expenses recorded</Text>
        <Text style={styles.amount}>{formatCurrency(summary.totalExpenses)}</Text>
        <Text variant="muted">
          {summary.visitCount} {summary.visitCount === 1 ? 'visit' : 'visits'}
          {summary.hoursOffWork > 0 ? ` · ${summary.hoursOffWork} hours off paid work` : ''}
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="title">Recent entries</Text>
        {loading ? <ActivityIndicator color={colors.blue500} /> : null}
        {error ? <Text variant="error">{error}</Text> : null}
        {!loading && visits.length === 0 ? (
          <Text variant="muted">No entries yet. Choose Add a cost to record a visit.</Text>
        ) : null}
        {visits.slice(0, 5).map((v) => (
          <View key={v.id} style={styles.entry}>
            <Text variant="label">{v.hospitalName ?? v.visitType}</Text>
            <Text variant="muted">
              {v.date} · {formatCurrency(v.expenses.reduce((s, e) => s + e.amount, 0))}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: space[24],
    gap: space[8],
  },
  amount: { fontFamily: 'Inter-700', fontSize: fontSize.amount, color: colors.blue500 },
  section: { gap: space[12] },
  entry: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: space[16],
    gap: space[4],
  },
});
