import {useCallback, useEffect, useState} from 'react';
import {useSnapClipStore} from './store/useSnapClipStore';
import {useSettingsStore, shouldPaste} from './store/useSettingsStore';
import {
  captureActiveWindow,
  emitCapture,
  hideOverlay,
  isTauri,
  onArm,
  onMouseGesture,
  pasteAtCursor,
  setClipboard,
  showOverlay,
} from './lib/tauri';
import {SettingsPanel} from './components/SettingsPanel';
import {History} from './components/History';

export function App() {
  const {
    mode,
    arm,
    activate,
    deactivate,
    setSourceBounds,
    setBlocks,
    setError,
    blocks,
    history,
    error,
  } = useSnapClipStore();
  const {captureDelayMs, pasteGesture} = useSettingsStore();

  const [countdown, setCountdown] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const nativeReady = isTauri();

  // Global mouse gesture → paste at cursor (fully mouse-driven, no keyboard).
  useEffect(() => {
    let dispose = () => {};
    onMouseGesture(event => {
      if (shouldPaste(pasteGesture, event)) {
        pasteAtCursor().catch(() => {});
      }
    }).then(fn => {
      dispose = fn;
    });
    return () => dispose();
  }, [pasteGesture]);

  // Tray "Armer la capture" → start the flow when idle.
  useEffect(() => {
    let dispose = () => {};
    onArm(() => {
      if (useSnapClipStore.getState().mode === 'idle') {
        setError(null);
        arm();
      }
    }).then(fn => {
      dispose = fn;
    });
    return () => dispose();
  }, [arm, setError]);

  const capture = useCallback(async () => {
    try {
      const {ocr, bounds} = await captureActiveWindow();
      setSourceBounds(bounds);
      if (!ocr.blocks || ocr.blocks.length === 0) {
        setError('Aucun texte détecté dans la fenêtre.');
        deactivate();
        await hideOverlay().catch(() => {});
        return;
      }
      setBlocks(ocr.blocks);
      await emitCapture({ocr, bounds});
      await showOverlay();
      activate();
    } catch {
      setError('La capture a échoué. Réessayez.');
      deactivate();
    }
  }, [activate, deactivate, setBlocks, setError, setSourceBounds]);

  // Arming countdown gives time to switch to the source window.
  useEffect(() => {
    if (mode !== 'arming') {
      return;
    }
    if (captureDelayMs <= 0) {
      capture();
      return;
    }
    setCountdown(Math.ceil(captureDelayMs / 1000));
    const tick = setInterval(
      () => setCountdown(prev => (prev > 1 ? prev - 1 : 0)),
      1000,
    );
    const timeout = setTimeout(() => capture(), captureDelayMs);
    return () => {
      clearInterval(tick);
      clearTimeout(timeout);
    };
  }, [mode, captureDelayMs, capture]);

  const isArming = mode === 'arming';
  const isActive = mode === 'selecting';
  const busy = isArming || isActive;

  const handlePrimary = () => {
    if (busy) {
      deactivate();
      hideOverlay().catch(() => {});
    } else {
      setError(null);
      arm();
    }
  };

  const statusLabel = isArming
    ? 'Armé · basculez vers la source'
    : isActive
    ? `${blocks.length} bloc${blocks.length > 1 ? 's' : ''} détecté${
        blocks.length > 1 ? 's' : ''
      }`
    : 'En attente';

  return (
    <div className="app">
      <header className="app__header">
        <div className="logo">S</div>
        <div>
          <div className="app__title">SnapClip</div>
          <div className="app__subtitle">Capturer · copier · coller — à la souris</div>
        </div>
      </header>

      <div className="card">
        <div className="status">
          <span
            className={`status__dot ${busy ? 'status__dot--active' : ''}`}
          />
          {statusLabel}
        </div>

        <p className="instruction">
          {isArming
            ? `Basculez vers la fenêtre à capturer… ${countdown}s`
            : isActive
            ? 'Cliquez un pin pour copier le bloc, ou survolez pour choisir mot par mot.'
            : 'Armez la capture puis basculez vers la fenêtre source.'}
        </p>

        {!nativeReady && (
          <div className="banner banner--warn">
            Mode aperçu (hors application native). Lancez SnapClip via Tauri pour
            activer la capture, l'OCR et le collage.
          </div>
        )}

        {error && <div className="banner banner--error">{error}</div>}

        <button
          className={`btn ${busy ? 'btn--danger' : ''}`}
          onClick={handlePrimary}
          disabled={!nativeReady && !busy}>
          {busy ? 'Annuler' : 'Armer la capture'}
        </button>

        <button className="link" onClick={() => setShowSettings(v => !v)}>
          {showSettings ? 'Masquer les réglages' : 'Réglages'}
        </button>
      </div>

      {showSettings && <SettingsPanel />}

      {history.length > 0 && (
        <div className="card">
          <div className="section-title">Historique</div>
          <History items={history} onPick={text => setClipboard(text)} />
        </div>
      )}

      <div className="footer">
        Double clic droit ou clic long droit pour coller
      </div>
    </div>
  );
}
