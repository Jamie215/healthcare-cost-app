import { router } from 'expo-router';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';

export default function AddCost() {
  return (
    <Screen>
      <Text variant="title">What would you like to record?</Text>
      <Button label="Healthcare visit" onPress={() => router.push('/visit')} />
      {/* TODO: port the medication and refill flow from prototype/ (#new-medication). */}
      <Button label="Medication (coming soon)" variant="secondary" disabled onPress={() => {}} />
    </Screen>
  );
}
