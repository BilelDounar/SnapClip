import {useColorScheme} from 'react-native';
import {lightTheme, darkTheme, type Theme} from './colors';

export function useTheme(): Theme {
  const isDark = useColorScheme() === 'dark';
  return isDark ? darkTheme : lightTheme;
}

export {lightTheme, darkTheme};
export type {Theme};
