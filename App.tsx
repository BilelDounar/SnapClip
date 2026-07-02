import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Easing,
} from 'react-native';
import {
  getInputHookEvents,
  InputHookModule,
  OcrModule,
  OverlayModule,
  ClipboardModule,
} from './src/nativeModules';
import {useSnapClipStore} from './src/store/useSnapClipStore';
import {Overlay} from './src/components/Overlay';
import {ActionButton} from './src/components/ActionButton';
import {StatusBadge} from './src/components/StatusBadge';
import {useTheme} from './src/theme/useTheme';

function App(): React.JSX.Element {
  const theme = useTheme();
  const {
    mode,
    activate,
    deactivate,
    setSource,
    setBlocks,
    resetSelection,
    blocks,
    copiedText,
  } = useSnapClipStore();

  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (!InputHookModule) {
      console.warn('InputHookModule native module not available');
      return;
    }
    InputHookModule.startHook();
    const events = getInputHookEvents();
    const subscription = events.addListener('OnMouseEvent', (event: string) => {
      if (event === 'double-right-click' || event === 'long-right-click') {
        ClipboardModule?.pasteAtCursor();
      }
    });
    return () => {
      subscription.remove();
      InputHookModule.stopHook();
    };
  }, []);

  const handleActivate = async () => {
    setLoading(true);
    try {
      const hwnd = await OverlayModule.getForegroundWindow();
      setSource(hwnd);
      const json = await OcrModule.captureWindowText(hwnd);
      const result = JSON.parse(json);
      setBlocks(result.blocks ?? []);
      activate();
    } catch (error) {
      console.error('Activation failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = () => {
    deactivate();
    resetSelection();
  };

  const isActive = mode !== 'idle';
  const isDark = theme.background === '#0F172A';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>
        <View style={styles.header}>
          <View style={[styles.logoCircle, {backgroundColor: theme.primary, shadowColor: theme.primaryDark}]}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={[styles.title, {color: theme.text}]}>SnapClip</Text>
          <Text style={[styles.subtitle, {color: theme.textSecondary}]}>
            Extraction de texte par OCR · Collage à la souris
          </Text>
        </View>

        <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow}]}>
          <StatusBadge
            mode={mode}
            theme={theme}
            blockCount={blocks.length}
            copiedText={copiedText}
          />

          <View style={styles.spacer} />

          <Text style={[styles.instruction, {color: theme.textMuted}]}>
            {isActive
              ? 'Cliquez un pin pour copier tout le bloc, ou survolez pour sélectionner mot par mot.'
              : 'Activez SnapClip puis basculez vers la fenêtre source.'}
          </Text>

          <View style={styles.buttonRow}>
            <ActionButton
              label={isActive ? 'Désactiver' : 'Activer'}
              onPress={isActive ? handleDeactivate : handleActivate}
              theme={theme}
              variant={isActive ? 'danger' : 'primary'}
              loading={loading}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, {color: theme.textMuted}]}>
            Double clic droit ou clic long droit pour coller
          </Text>
        </View>
      </Animated.View>

      {isActive && <Overlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
  spacer: {
    height: 18,
  },
  instruction: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 28,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default App;
