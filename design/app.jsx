const { useState, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "trackHeight": 96,
  "waveStyle": "bars",
  "accentHue": 268,
  "showSelection": true,
  "showPlayhead": true,
  "tool": "select"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tool, setTool] = useState(t.tool || "cut");
  const [zoom, setZoom] = useState(1.4);
  const [playing, setPlaying] = useState(false);

  const { TRACKS, PROJECT_LENGTH, SELECTION, PLAYHEAD } = window.MAYCAST;

  // Apply tweakable accent hue
  React.useEffect(() => {
    const h = t.accentHue;
    document.documentElement.style.setProperty("--accent", `oklch(56% 0.16 ${h})`);
    document.documentElement.style.setProperty("--accent-strong", `oklch(48% 0.18 ${h})`);
    document.documentElement.style.setProperty("--accent-soft", `oklch(94% 0.04 ${h})`);
    document.documentElement.style.setProperty("--sel", `oklch(56% 0.16 ${h} / 0.18)`);
    document.documentElement.style.setProperty("--sel-edge", `oklch(56% 0.16 ${h} / 0.55)`);
  }, [t.accentHue]);

  React.useEffect(() => {
    document.documentElement.style.setProperty("--track-h", `${t.trackHeight}px`);
  }, [t.trackHeight]);

  // Track-lane width derives from project length × pxPerSec
  const basePxPerSec = 8; // at zoom = 1.0
  const pxPerSec = basePxPerSec * zoom;

  return (
    <div className="app">
      <TopBar />
      <Transport
        tool={tool} setTool={setTool}
        zoom={zoom} setZoom={setZoom}
        playing={playing} setPlaying={setPlaying}
        selection={SELECTION}
        projectLength={PROJECT_LENGTH}
      />
      <div className="editor">
        <div style={{ position: "relative", flex: 1, display: "flex", minWidth: 0 }}>
          <Tracks
            tracks={TRACKS}
            projectLength={PROJECT_LENGTH}
            pxPerSec={pxPerSec}
            selection={t.showSelection ? SELECTION : { start: 0, end: 0 }}
            playhead={t.showPlayhead ? PLAYHEAD : -100}
            tool={tool}
          />
        </div>
      </div>

      <div className="statusbar">
        <span className="sb-item">
          <span className="sb-pulse" />
          <strong>準備完了</strong>
        </span>
        <span className="sb-item mono">44.1 kHz · 16-bit · Stereo</span>
        <span className="sb-item">サンプル数 <strong>5,820,800</strong></span>
        <div className="sb-spacer" />
        <span className="sb-item">エクスポート: <strong>MP3 320kbps</strong></span>
        <span className="sb-item mono">CPU 4.2%</span>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Editor" />
        <TweakSlider label="Track height" value={t.trackHeight} min={64} max={160} step={4} unit="px"
          onChange={(v) => setTweak("trackHeight", v)} />
        <TweakRadio label="Waveform" value={t.waveStyle}
          options={["bars", "line", "filled"]}
          onChange={(v) => setTweak("waveStyle", v)} />

        <TweakSection label="Theme" />
        <TweakSlider label="Accent hue" value={t.accentHue} min={0} max={360} step={2} unit="°"
          onChange={(v) => setTweak("accentHue", v)} />

        <TweakSection label="Overlays" />
        <TweakToggle label="Selection range" value={t.showSelection}
          onChange={(v) => setTweak("showSelection", v)} />
        <TweakToggle label="Playhead" value={t.showPlayhead}
          onChange={(v) => setTweak("showPlayhead", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
