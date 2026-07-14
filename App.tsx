import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
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
import {
  useSnapClipStore,
  type WindowBounds,
} from './src/store/useSnapClipStore';
import {useSettingsStore, shouldPaste} from './src/store/useSettingsStore';
import {Overlay} from './src/components/Overlay';
import {ActionButton} from './src/components/ActionButton';
import {StatusBadge} from './src/components/StatusBadge';
import {SettingsPanel} from './src/components/SettingsPanel';
import {useTheme} from './src/theme/useTheme';

function App(): React.JSX.Element {
  const theme = useTheme();
  const {
    mode,
    arm,
    activate,
    deactivate,
    setSource,
    setSourceBounds,
    setBlocks,
    resetSelection,
    setError,
    blocks,
    copiedText,
    history,
    error,
  } = useSnapClipStore();
  const {captureDelayMs, pasteGesture} = useSettingsStore();

  const [countdown, setCountdown] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const nativeReady = Boolean(
    OverlayModule?.getForegroundWindow && OcrModule?.captureWindowText,
  );

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
    const hook = InputHookModule;
    if (!hook) {
      return;
    }
    hook.startHook();
    const events = getInputHookEvents();
    const subscription = events.addListener('OnMouseEvent', (event: string) => {
      if (shouldPaste(pasteGesture, event)) {
        ClipboardModule?.pasteAtCursor();
      }
    });
    return () => {
      subscription.remove();
      hook.stopHook();
    };
  }, [pasteGesture]);

  const capture = useCallback(async () => {
    try {
      if (
        !OverlayModule?.getForegroundWindow ||
        !OcrModule?.captureWindowText
      ) {
        setError('Modules natifs OCR indisponibles.');
        deactivate();
        return;
      }
      const hwnd = await OverlayModule.getForegroundWindow();
      setSource(hwnd);

      if (OverlayModule.getWindowBounds) {
        try {
          const boundsJson = await OverlayModule.getWindowBounds(hwnd);
          setSourceBounds(JSON.parse(boundsJson) as WindowBounds);
        } catch {
          setSourceBounds(null);
        }
      }

      const json = await OcrModule.captureWindowText(hwnd);
      const result = JSON.parse(json);
      const detected = result.blocks ?? [];
      if (detected.length === 0) {
        setError('Aucun texte détecté dans la fenêtre.');
        deactivate();
        return;
      }
      setBlocks(detected);
      activate();
    } catch (err) {
      setError('La capture a échoué. Réessayez.');
      deactivate();
    }
  }, [activate, deactivate, setBlocks, setError, setSource, setSourceBounds]);

  // Arming countdown: gives the user time to switch to the source window
  // before the OCR snapshot, so the capture targets it and not SnapClip.
  useEffect(() => {
    if (mode !== 'arming') {
      return;
    }
    if (captureDelayMs <= 0) {
      capture();
      return;
    }
    setCountdown(Math.ceil(captureDelayMs / 1000));
    const tick = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    const timeout = setTimeout(() => capture(), captureDelayMs);
    return () => {
      clearInterval(tick);
      clearTimeout(timeout);
    };
  }, [mode, captureDelayMs, capture]);

  const handleArm = () => {
    setError(null);
    arm();
  };

  const handleDeactivate = () => {
    deactivate();
    resetSelection();
  };

  const isActive = mode === 'selecting';
  const isArming = mode === 'arming';
  const isDark = theme.background === '#0F172A';

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View
          style={[
            styles.content,
            {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
          ]}>
          <View style={styles.header}>
            <View
              style={[
                styles.logoCircle,
                {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primaryDark,
                },
              ]}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={[styles.title, {color: theme.text}]}>SnapClip</Text>
            <Text style={[styles.subtitle, {color: theme.textSecondary}]}>
              Extraction de texte par OCR · Collage à la souris
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: theme.shadow,
              },
            ]}>
            <StatusBadge
              mode={mode}
              theme={theme}
              blockCount={blocks.length}
              copiedText={copiedText}
            />

            <View style={styles.spacer} />

            <Text style={[styles.instruction, {color: theme.textMuted}]}>
              {isArming
                ? `Basculez vers la fenêtre source… capture dans ${countdown}s`
                : isActive
                ? 'Cliquez un pin pour copier le bloc, ou survolez pour sélectionner mot par mot.'
                : 'Armez SnapClip puis basculez vers la fenêtre à capturer.'}
            </Text>

            {!nativeReady && (
              <View
                style={[styles.banner, {backgroundColor: theme.overlayHover}]}>
                <Text style={[styles.bannerText, {color: theme.textSecondary}]}>
                  Modules natifs indisponibles. Lancez l'application Windows
                  compilée pour activer la capture.
                </Text>
              </View>
            )}

            {error && (
              <View
                style={[
                  styles.banner,
                  {
                    backgroundColor: theme.flash,
                    borderColor: theme.danger,
                    borderWidth: 1,
                  },
                ]}>
                <Text style={[styles.bannerText, {color: theme.danger}]}>
                  {error}
                </Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <ActionButton
                label={
                  isActive || isArming
                    ? 'Désactiver'
                    : nativeReady
                    ? 'Armer la capture'
                    : 'Indisponible'
                }
                onPress={isActive || isArming ? handleDeactivate : handleArm}
                theme={theme}
                variant={isActive || isArming ? 'danger' : 'primary'}
                loading={false}
                disabled={!nativeReady && !isActive && !isArming}
              />
            </View>

            <Pressable
              onPress={() => setShowSettings(prev => !prev)}
              style={styles.settingsToggle}>
              <Text style={[styles.settingsToggleText, {color: theme.primary}]}>
                {showSettings ? 'Masquer les réglages' : 'Réglages'}
              </Text>
            </Pressable>
          </View>

          {showSettings && <SettingsPanel theme={theme} />}

          {history.length > 0 && (
            <View
              style={[
                styles.card,
                styles.historyCard,
                {backgroundColor: theme.surface, borderColor: theme.border},
              ]}>
              <Text style={[styles.historyTitle, {color: theme.textSecondary}]}>
                Historique
              </Text>
              {history.map((item, index) => (
                <Pressable
                  key={`${index}-${item.slice(0, 12)}`}
                  onPress={() => ClipboardModule?.setText(item)}
                  style={[styles.historyItem, {borderColor: theme.border}]}>
                  <Text
                    numberOfLines={1}
                    style={[styles.historyText, {color: theme.text}]}>
                    {item.replace(/\n/g, ' ')}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={[styles.footerText, {color: theme.textMuted}]}>
              Double clic droit ou clic long droit pour coller
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {isActive && <Overlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
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
  banner: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  settingsToggle: {
    marginTop: 16,
    alignItems: 'center',
  },
  settingsToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyCard: {
    marginTop: 16,
    gap: 8,
    shadowOpacity: 0,
    elevation: 0,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  historyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default App;
