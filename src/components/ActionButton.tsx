import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text} from 'react-native';
import type {Theme} from '../theme/useTheme';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  theme: Theme;
  variant?: 'primary' | 'danger';
  icon?: string;
  loading?: boolean;
}

export function ActionButton({
  label,
  onPress,
  theme,
  variant = 'primary',
  loading = false,
}: ActionButtonProps): React.JSX.Element {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [opacityAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 40,
    }).start();
  };

  const bgColor = variant === 'danger' ? theme.danger : theme.primary;
  const bgDark = variant === 'danger' ? theme.dangerDark : theme.primaryDark;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: opacityAnim,
          transform: [{scale: scaleAnim}],
        },
      ]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={loading}
        style={({pressed}) => [
          styles.button,
          {
            backgroundColor: pressed ? bgDark : bgColor,
            shadowColor: theme.shadowElevated,
          },
        ]}>
        <Text style={styles.label}>{loading ? '...' : label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
