import {useColorScheme} from 'react-native';
import {lightTheme, darkTheme, type Theme} from './colors';

export function useTheme(): Theme {
  const isDark = useColorScheme() === 'dark';
  return isDark ? darkTheme : lightTheme;
}

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}

export {lightTheme, darkTheme};
export type {Theme};
