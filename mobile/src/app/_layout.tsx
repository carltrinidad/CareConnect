import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Appearance, Platform } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useAppStore } from '@/lib/store';
import { useEffect, useState } from 'react';

export const unstable_settings = {
  initialRouteName: 'onboarding',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  const isOnboarded = useAppStore((s) => s.isOnboarded);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Check if store is hydrated
    const checkHydration = async () => {
      // Small delay to ensure zustand persist has hydrated
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsHydrated(true);
      SplashScreen.hideAsync();
    };
    checkHydration();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    const inLogin = segments[0] === 'login';

    if (isOnboarded && (inOnboarding || inLogin)) {
      // User is onboarded but still on onboarding/login, redirect to tabs
      router.replace('/(tabs)');
    } else if (!isOnboarded && inAuthGroup) {
      // User is not onboarded but in tabs, redirect to onboarding
      router.replace('/onboarding');
    }
  }, [isOnboarded, isHydrated, segments]);

  if (!isHydrated) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="facility/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="caregiver/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="edit-facility" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="support" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const themePreference = useAppStore((s) => s.themePreference);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // On web, toggle the 'dark' class on <html> for NativeWind/Tailwind
      if (typeof document !== 'undefined') {
        if (themePreference === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (themePreference === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // System default - check media query
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }
    } else {
      if (themePreference === 'light') {
        Appearance.setColorScheme('light');
      } else if (themePreference === 'dark') {
        Appearance.setColorScheme('dark');
      } else {
        Appearance.setColorScheme(null);
      }
    }
  }, [themePreference]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootLayoutNav colorScheme={colorScheme} />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
