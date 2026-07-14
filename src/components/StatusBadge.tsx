import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import type {Theme} from '../theme/useTheme';
import type {AppMode} from '../store/useSnapClipStore';

interface StatusBadgeProps {
  mode: AppMode;
  theme: Theme;
  blockCount?: number;
  copiedText?: string;
}

export function StatusBadge({
  mode,
  theme,
  blockCount = 0,
  copiedText = '',
}: StatusBadgeProps): React.JSX.Element {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  useEffect(() => {
    if (mode === 'selecting') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulseAnim.setValue(0);
  }, [mode, pulseAnim]);

  const isActive = mode !== 'idle';
  const dotColor = isActive ? theme.success : theme.textMuted;
  const label =
    mode === 'idle'
      ? 'En attente'
      : mode === 'arming'
      ? 'Armé · basculez vers la source'
      : mode === 'selecting'
      ? `${blockCount} bloc${blockCount > 1 ? 's' : ''} détecté${
          blockCount > 1 ? 's' : ''
        }`
      : 'Copie en cours...';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: opacityAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <View style={styles.row}>
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: dotColor,
              opacity: isActive
                ? pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 1],
                  })
                : 1,
            },
          ]}
        />
        <Text style={[styles.text, {color: theme.textSecondary}]}>{label}</Text>
      </View>
      {copiedText.length > 0 && (
        <View style={[styles.copiedBadge, {backgroundColor: theme.success}]}>
          <Text style={styles.copiedText}>
            Copié :{' '}
            {copiedText.length > 30
              ? copiedText.substring(0, 30) + '...'
              : copiedText}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  copiedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  copiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
