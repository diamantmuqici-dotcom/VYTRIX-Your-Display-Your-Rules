import { useMemo, useState } from "react";
import { Gamepad2, Search, Save, Play, Trash2, Link2, Crosshair as CrosshairIcon } from "lucide-react";
import type { CrosshairDesign, GameProfile } from "@vytrix/shared-types";
import { DEFAULT_COLOR_SETTINGS } from "@vytrix/validation";
import { useApp } from "@/stores/app";
import { Panel, PageHead, EmptyState } from "@/components/ui/Panel";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { CrosshairRenderer } from "@/crosshair/renderer";
import { normalizeDesign } from "@/crosshair/validate";
import type { StudioProps } from "./shared";

function allDesigns(crosshairs: CrosshairDesign[], presets: CrosshairDesign[]): CrosshairDesign[] {
  const map = new Map<string, CrosshairDesign>();
  for (const item of [...presets, ...crosshairs]) {
    if (!map.has(item.id)) map.set(item.id, normalizeDesign(item));
  }
  return [...map.values()];
}

export default function Profiles({ design, selectDesign }: StudioProps) {
  const app = useApp();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(() => app.state.crosshairGameProfiles[0]?.gameId ?? app.state.games[0]?.id ?? "");
  const designs = useMemo(() => allDesigns(app.state.crosshairs, app.state.crosshairPresets), [app.state.crosshairs, app.state.crosshairPresets]);
  const games = useMemo(() => app.state.games.filter((game) =>
    !search || `${game.name} ${game.executableHints.join(" ")} ${game.category ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  ), [app.state.games, search]);
  const selectedGame = app.state.games.find((game) => game.id === selectedId) ?? games[0] ?? null;
  const profile = app.state.crosshairGameProfiles.find((item) => item.gameId === selectedGame?.id);
  const [designId, setDesignId] = useState(() => profile?.designId ?? design.id);
  const [autoSwitch, setAutoSwitch] = useState(() => profile?.autoSwitch ?? true);
  const chosen = designs.find((item) => item.id === designId) ?? design;

  const save = () => {
    if (!selectedGame) return;
    const id = `crosshair-profile-${selectedGame.id}`;
    app.upsertCrosshairGameProfile({
      id,
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      designId: chosen.id,
      presetId: null,
      autoSwitch,
      lastUsed: Date.now(),
    });
    const existing = app.state.profiles.find((item) => item.gameId === selectedGame.id);
    const next: GameProfile = existing
      ? { ...existing, applyCrosshair: true, crosshairId: chosen.id, autoSwitch }
      : {
        id: `profile-${selectedGame.id}`,
        gameId: selectedGame.id,
        name: selectedGame.name,
        color: { ...DEFAULT_COLOR_SETTINGS },
        resolution: null,
        applyCrosshair: true,
        crosshairId: chosen.id,
        performanceNote: "",
        autoSwitch,
      };
    app.upsertProfile(next);
    app.log(`Crosshair assigned to ${selectedGame.name}`);
  };

  const remove = () => {
    if (!selectedGame) return;
    app.removeCrosshairGameProfile(`crosshair-profile-${selectedGame.id}`);
    const existing = app.state.profiles.find((item) => item.gameId === selectedGame.id);
    if (existing) app.upsertProfile({ ...existing, applyCrosshair: false, crosshairId: null });
    app.log(`Crosshair assignment removed for ${selectedGame.name}`);
  };

  return (
    <div>
      <PageHead
        title="Crosshair game profiles"
        description="Assign an original design to a detected game. Profiles reuse the existing game catalog and foreground detection; no game files are read or modified."
      />
      <div className="grid" style={{ gridTemplateColumns: "minmax(260px,340px) minmax(320px,1fr)", gap: 14, alignItems: "start" }}>
        <Panel title="Games" icon={Gamepad2}>
          <div className="search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search game catalog" /></div>
          <div style={{ maxHeight: 520, overflow: "auto", marginTop: 10 }}>
            {games.slice(0, 200).map((game) => (
              <button
                key={game.id}
                className={`btn ghost row ${selectedGame?.id === game.id ? "active" : ""}`}
                style={{ width: "100%", justifyContent: "space-between" }}
                onClick={() => {
                  setSelectedId(game.id);
                  const found = app.state.crosshairGameProfiles.find((item) => item.gameId === game.id);
                  setDesignId(found?.designId ?? design.id);
                  setAutoSwitch(found?.autoSwitch ?? true);
                }}
              >
                <span>{game.name}</span>
                <span className="badge">{game.detectionConfidence ?? (game.verifiedDetection ? "verified" : "manual")}</span>
              </button>
            ))}
          </div>
        </Panel>

        <div className="grid" style={{ gap: 14 }}>
          <Panel title="Assignment" icon={Link2}>
            {!selectedGame ? <EmptyState icon={Gamepad2} title="No game selected" detail="Pick a game from the catalog." /> : (
              <>
                <div className="grid" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
                  <div className="card"><div className="metric" style={{ fontSize: 14 }}>{selectedGame.name}</div><div className="metric-label">Game</div></div>
                  <div className="card"><div className="metric" style={{ fontSize: 14 }}>{selectedGame.launcher}</div><div className="metric-label">Launcher</div></div>
                  <div className="card"><div className="metric" style={{ fontSize: 14 }}>{profile ? "assigned" : "unassigned"}</div><div className="metric-label">State</div></div>
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <label>Crosshair design</label>
                  <select value={designId} onChange={(event) => setDesignId(event.target.value)}>
                    {designs.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.advanced.shape}</option>)}
                  </select>
                </div>
                <ToggleRow label="Switch automatically when this game is detected" checked={autoSwitch} onChange={setAutoSwitch} />
                <div className="notice">
                  The overlay draws when the native runtime is connected, crosshair visibility is enabled, and per-game rules allow this title. Compatibility is reported by the runtime, never assumed.
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn primary" onClick={save}><Save size={14} /> Save assignment</button>
                  <button className="btn" onClick={() => selectDesign(chosen)}><Play size={14} /> Apply now</button>
                  {profile ? <button className="btn danger" onClick={remove}><Trash2 size={14} /> Remove</button> : null}
                </div>
              </>
            )}
          </Panel>

          <Panel title="Selected design" icon={CrosshairIcon}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <CrosshairRenderer design={chosen} size={240} background="dark" animate={false} />
            </div>
            <div className="tiny" style={{ marginTop: 10 }}>
              {chosen.name} · {chosen.advanced.shape} · {chosen.color} · scale {chosen.scale.toFixed(2)}×
            </div>
          </Panel>

          <Panel title="Assigned profiles" icon={Link2}>
            {app.state.crosshairGameProfiles.length === 0 ? (
              <EmptyState icon={Link2} title="No assignments" detail="Assign a design to a game to see it here." />
            ) : app.state.crosshairGameProfiles.map((item) => (
              <div className="row" key={item.id}>
                <button
                  className="btn ghost"
                  onClick={() => {
                    setSelectedId(item.gameId);
                    setDesignId(item.designId);
                    setAutoSwitch(item.autoSwitch);
                    const target = designs.find((entry) => entry.id === item.designId);
                    if (target) selectDesign(target);
                  }}
                >
                  {item.gameName}
                </button>
                <span className="badge">{item.autoSwitch ? "auto" : "manual"}</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
