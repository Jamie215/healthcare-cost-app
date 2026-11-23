import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { VisitForm } from '@/components/visit-form';
import { isVisitCategory } from '@/data/visit-types';

export default function VisitDetailsRoute() {
  const { category } = useLocalSearchParams<{ category: string }>();
  if (!isVisitCategory(category)) {
    return (
      <Screen back>
        <Text variant="error">Unknown visit category.</Text>
      </Screen>
    );
  }
  return <VisitForm category={category} />;
}
