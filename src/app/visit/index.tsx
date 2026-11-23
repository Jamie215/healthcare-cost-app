import { router } from 'expo-router';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { VISIT_CATEGORIES, VISIT_CATEGORY_KEYS } from '@/data/visit-types';

export default function VisitCategories() {
  return (
    <Screen back>
      <Text variant="title">What kind of visit was it?</Text>
      {VISIT_CATEGORY_KEYS.map((key) => (
        <Button
          key={key}
          variant="secondary"
          label={VISIT_CATEGORIES[key].label}
          onPress={() => router.push({ pathname: '/visit/[category]', params: { category: key } })}
        />
      ))}
    </Screen>
  );
}
