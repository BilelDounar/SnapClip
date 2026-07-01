import React, {useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {
  getInputHookEvents,
  InputHookModule,
  OcrModule,
  OverlayModule,
  ClipboardModule,
} from './src/nativeModules';
import {useSnapClipStore} from './src/store/useSnapClipStore';
import {Overlay} from './src/components/Overlay';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const {mode, activate, deactivate, setSource, setBlocks, resetSelection} =
    useSnapClipStore();

  useEffect(() => {
    InputHookModule.startHook();
    const events = getInputHookEvents();
    const subscription = events.addListener('OnMouseEvent', (event: string) => {
      if (event === 'double-right-click' || event === 'long-right-click') {
        ClipboardModule.pasteAtCursor();
      }
    });
    return () => {
      subscription.remove();
      InputHookModule.stopHook();
    };
  }, []);

  const handleActivate = async () => {
    try {
      const hwnd = await OverlayModule.getForegroundWindow();
      setSource(hwnd);
      const json = await OcrModule.captureWindowText(hwnd);
      const result = JSON.parse(json);
      setBlocks(result.blocks ?? []);
      activate();
    } catch (error) {
      console.error('Activation failed', error);
    }
  };

  const handleDeactivate = () => {
    deactivate();
    resetSelection();
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={styles.content}>
        <Text style={styles.title}>SnapClip</Text>
        <Text style={styles.subtitle}>
          {mode === 'idle'
            ? 'Prêt à copier sans clavier'
            : 'Mode copie actif'}
        </Text>
        <TouchableOpacity
          style={[
            styles.button,
            mode === 'selecting' ? styles.buttonActive : null,
          ]}
          onPress={mode === 'idle' ? handleActivate : handleDeactivate}>
          <Text style={styles.buttonText}>
            {mode === 'idle' ? 'Activer' : 'Désactiver'}
          </Text>
        </TouchableOpacity>
      </View>
      {mode !== 'idle' && <Overlay />}
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
    padding: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    opacity: 0.7,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
  },
  buttonActive: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default App;
