import { render, screen } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import RootLayout from '@/app/_layout';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
jest.mock('expo-router', () => {
  function Stack() {
    const { Text } = jest.requireActual('react-native');
    return <Text>App content</Text>;
  }
  Stack.Screen = function Screen() {
    return null;
  };
  return { Stack };
});

const mockUseFonts = useFonts as jest.Mock;

describe('RootLayout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('keeps the splash screen up while fonts load', async () => {
    mockUseFonts.mockReturnValue([false, null]);
    await render(<RootLayout />);
    expect(screen.queryByText('App content')).not.toBeOnTheScreen();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('opens the app once fonts load', async () => {
    mockUseFonts.mockReturnValue([true, null]);
    await render(<RootLayout />);
    expect(screen.getByText('App content')).toBeOnTheScreen();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('still opens the app if the fonts fail to load', async () => {
    mockUseFonts.mockReturnValue([false, new Error('font failed')]);
    await render(<RootLayout />);
    expect(screen.getByText('App content')).toBeOnTheScreen();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });
});
