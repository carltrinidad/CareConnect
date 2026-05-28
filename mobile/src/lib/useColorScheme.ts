import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useAppStore } from '@/lib/store';

export function useColorScheme(): 'light' | 'dark' | null | undefined {
  const systemScheme = useSystemColorScheme();
  const themePreference = useAppStore((s) => s.themePreference);

  if (themePreference === 'light') return 'light';
  if (themePreference === 'dark') return 'dark';
  return systemScheme;
}
