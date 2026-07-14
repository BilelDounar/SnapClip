import {
  CAPTURE_DELAY_OPTIONS,
  useSettingsStore,
  type PasteGesture,
} from '../store/useSettingsStore';

interface Option<T> {
  value: T;
  label: string;
}

interface RowProps<T extends string | number | boolean> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

function Row<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
}: RowProps<T>) {
  return (
    <div className="setting">
      <div className="setting__label">{label}</div>
      <div className="pills">
        {options.map(opt => (
          <button
            key={String(opt.value)}
            className={`pill ${opt.value === value ? 'pill--active' : ''}`}
            onClick={() => onChange(opt.value)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const GESTURES: Option<PasteGesture>[] = [
  {value: 'double', label: 'Double clic'},
  {value: 'long', label: 'Clic long'},
  {value: 'both', label: 'Les deux'},
];

export function SettingsPanel() {
  const {
    captureDelayMs,
    pasteGesture,
    showWordDots,
    minimizeToTray,
    setCaptureDelayMs,
    setPasteGesture,
    setShowWordDots,
    setMinimizeToTray,
  } = useSettingsStore();

  return (
    <div className="card">
      <div className="section-title">Réglages</div>
      <Row
        label="Délai de capture"
        value={captureDelayMs}
        onChange={setCaptureDelayMs}
        options={CAPTURE_DELAY_OPTIONS.map(ms => ({
          value: ms,
          label: ms === 0 ? 'Immédiat' : `${ms / 1000}s`,
        }))}
      />
      <Row
        label="Geste de collage"
        value={pasteGesture}
        onChange={setPasteGesture}
        options={GESTURES}
      />
      <Row
        label="Sélection par mot"
        value={showWordDots}
        onChange={setShowWordDots}
        options={[
          {value: true, label: 'Activée'},
          {value: false, label: 'Désactivée'},
        ]}
      />
      <Row
        label="Rester dans la barre système"
        value={minimizeToTray}
        onChange={setMinimizeToTray}
        options={[
          {value: true, label: 'Oui'},
          {value: false, label: 'Non'},
        ]}
      />
    </div>
  );
}
