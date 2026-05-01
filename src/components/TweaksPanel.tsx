import { useStore } from "../state/store";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TweaksPanel({ open, onClose }: Props) {
  const tweaks = useStore((s) => s.tweaks);
  const setTweak = useStore((s) => s.setTweak);
  if (!open) return null;
  return (
    <div className="tweaks-panel">
      <div className="tweaks-head">
        <strong>Tweaks</strong>
        <button className="tweaks-x" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="tweaks-body">
        <div className="tweaks-section">Editor</div>
        <SliderRow
          label="Track height"
          value={tweaks.trackHeight}
          min={64}
          max={160}
          step={4}
          unit="px"
          onChange={(v) => setTweak("trackHeight", v)}
        />
        <SegRow
          label="Waveform"
          options={["bars", "line", "filled"]}
          value={tweaks.waveStyle}
          onChange={(v) => setTweak("waveStyle", v as any)}
        />

        <div className="tweaks-section">Theme</div>
        <SliderRow
          label="Accent hue"
          value={tweaks.accentHue}
          min={0}
          max={360}
          step={2}
          unit="°"
          onChange={(v) => setTweak("accentHue", v)}
        />

        <div className="tweaks-section">Overlays</div>
        <ToggleRow
          label="Selection range"
          value={tweaks.showSelection}
          onChange={(v) => setTweak("showSelection", v)}
        />
        <ToggleRow
          label="Playhead"
          value={tweaks.showPlayhead}
          onChange={(v) => setTweak("showPlayhead", v)}
        />
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="tweaks-row">
      <div className="tweaks-lbl">
        <span>{label}</span>
        <span className="tweaks-val">
          {value}
          {unit ?? ""}
        </span>
      </div>
      <input
        type="range"
        className="tweaks-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="tweaks-row tweaks-row-h">
      <span>{label}</span>
      <button
        className="tweaks-toggle"
        data-on={value ? "1" : "0"}
        onClick={() => onChange(!value)}
      >
        <i />
      </button>
    </div>
  );
}

function SegRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="tweaks-row">
      <div className="tweaks-lbl">
        <span>{label}</span>
      </div>
      <div className="tweaks-seg">
        {options.map((o) => (
          <button
            key={o}
            className={value === o ? "is-on" : ""}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
