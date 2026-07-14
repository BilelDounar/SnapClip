import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {Theme} from '../theme/useTheme';
import {
  CAPTURE_DELAY_OPTIONS,
  useSettingsStore,
  type PasteGesture,
} from '../store/useSettingsStore';

interface SettingsPanelProps {
  theme: Theme;
}

const GESTURE_LABELS: Record<PasteGesture, string> = {
  double: 'Double clic',
  long: 'Clic long',
  both: 'Les deux',
};

function formatDelay(ms: number): string {
  return ms === 0 ? 'Immédiat' : `${ms / 1000}s`;
}

interface OptionRowProps<T> {
  theme: Theme;
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  render: (value: T) => string;
}

function OptionRow<T extends string | number | boolean>({
  theme,
  label,
  options,
  value,
  onChange,
  render,
}: OptionRowProps<T>): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, {color: theme.textSecondary}]}>{label}</Text>
      <View style={styles.pills}>
        {options.map(option => {
          const active = option === value;
          return (
            <Pressable
              key={String(option)}
              onPress={() => onChange(option)}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? theme.primary : theme.background,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}>
              <Text
                style={[
                  styles.pillText,
                  {color: active ? '#FFFFFF' : theme.textSecondary},
                ]}>
                {render(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SettingsPanel({theme}: SettingsPanelProps): React.JSX.Element {
  const {
    captureDelayMs,
    pasteGesture,
    showWordDots,
    setCaptureDelayMs,
    setPasteGesture,
    setShowWordDots,
  } = useSettingsStore();

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.surface, borderColor: theme.border},
      ]}>
      <OptionRow
        theme={theme}
        label="Délai de capture"
        options={CAPTURE_DELAY_OPTIONS}
        value={captureDelayMs}
        onChange={setCaptureDelayMs}
        render={formatDelay}
      />
      <OptionRow<PasteGesture>
        theme={theme}
        label="Geste de collage"
        options={['double', 'long', 'both']}
        value={pasteGesture}
        onChange={setPasteGesture}
        render={value => GESTURE_LABELS[value]}
      />
      <OptionRow
        theme={theme}
        label="Sélection par mot"
        options={[true, false]}
        value={showWordDots}
        onChange={setShowWordDots}
        render={value => (value ? 'Activée' : 'Désactivée')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    gap: 14,
  },
  row: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
