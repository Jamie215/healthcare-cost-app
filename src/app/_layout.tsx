import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { createEmpowerClient, EmpowerProvider } from '@/api/empower';
import { VisitsProvider } from '@/api/visits';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-400': require('@/assets/fonts/Inter-400.ttf'),
    'Inter-500': require('@/assets/fonts/Inter-500.ttf'),
    'Inter-600': require('@/assets/fonts/Inter-600.ttf'),
    'Inter-700': require('@/assets/fonts/Inter-700.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <EmpowerProvider client={() => createEmpowerClient()}>
      <VisitsProvider>
        <Stack
          screenOptions={{
            // Screens draw their own title and back control (as in the prototype), so the
            // native header would only duplicate them and take vertical space.
            headerShown: false,
            contentStyle: { backgroundColor: colors.page },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          <Stack.Screen name="add-cost" options={{ title: 'Add a cost' }} />
          <Stack.Screen name="visit/index" options={{ title: 'Record a healthcare visit' }} />
          <Stack.Screen name="visit/[category]" options={{ title: 'Visit details' }} />
        </Stack>
      </VisitsProvider>
    </EmpowerProvider>
  );
}
