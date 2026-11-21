import { useMemo, useState } from "react";
import { Search, Plus, Copy, Trash2, Download, RotateCcw, ShieldCheck, ShieldAlert, Gamepad2 } from "lucide-react";
import type { GameEntry, GameProfile, Launcher } from "@vytrix/shared-types";
import { DATABASE_GAME_COUNT } from "@/data/games";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { Panel, PageHead, EmptyState } from "@/components/ui/Panel";
import { ParamSlider } from "@/components/sliders/ParamSlider";
import { downloadText } from "@/utils/download";

const LAUNCHERS: Launcher[] = ["steam", "epic", "riot", "xbox", "microsoft-store", "battle-net", "ubisoft-connect", "ea-app", "manual"];
const COLOR_FIELDS = ["saturation", "vibrance", "gamma", "brightness", "contrast", "hue"] as const;

export default function GameProfiles() {
  const { state, addGame, removeGame, upsertProfile, removeProfile, log } = useApp();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [launcherFilter, setLauncherFilter] = useState("all");
  const [detectionFilter, setDetectionFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExe, setNewExe] = useState("");
  const [newLauncher, setNewLauncher] = useState<Launcher>("manual");

  const categories = useMemo(() => [...new Set(state.games.map((g) => g.category).filter((value): value is string => Boolean(value)))].sort(), [state.games]);
  const libraryLaunchers = useMemo(() => [...new Set(state.games.flatMap((g) => g.launchers ?? [g.launcher]))].sort(), [state.games]);

  const games = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return state.games.filter((game) => {
      if (needle) {
        const haystack = [game.name, game.category ?? "", ...game.executableHints, ...(game.supportedFeatures ?? [])].join(" ").toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (categoryFilter !== "all" && game.category !== categoryFilter) return false;
      if (launcherFilter !== "all" && !(game.launchers ?? [game.launcher]).includes(launcherFilter as Launcher)) return false;
      if (detectionFilter !== "all" && (game.detectionConfidence ?? "manual") !== detectionFilter) return false;
      return true;
    });
  }, [state.games, query, categoryFilter, launcherFilter, detectionFilter]);
  const selected = state.games.find((g) => g.id === selectedId) ?? null;
  const profile = state.profiles.find((p) => p.gameId === selected?.id) ?? null;

  const makeProfile = (game: GameEntry): GameProfile => profile ?? {
    id: `profile-${game.id}`, gameId: game.id, name: game.name, color: { ...state.color },
    resolution: null, applyCrosshair: false, crosshairId: null,
    performanceNote: "No game files are modified.", autoSwitch: state.settings.autoGameSwitch,
  };

  const save = () => {
    if (!selected) return;
    upsertProfile(makeProfile(selected));
    log(`Saved profile for ${selected.name}`);
    notify(`Profile saved for ${selected.name}`);
  };

  const add = () => {
    if (!newName.trim()) return;
    const game: GameEntry = {
      id: newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: newName.trim(), launcher: newLauncher,
      executableHints: newExe.trim() ? [newExe.trim().toLowerCase()] : [],
      verifiedDetection: false, icon: "manual",
    };
    addGame(game);
    setSelectedId(game.id);
    setAdding(false);
    setNewName(""); setNewExe("");
    notify("Game added as manually configurable");
  };

  return (
    <div className="page">
      <PageHead title="Game Profiles" description="Per-game display settings detected from process and window identity. Game files are never modified and no code is injected."
        action={<button className="btn primary" onClick={() => setAdding(true)}><Plus size={15} /> Add game</button>} />

      {adding ? <Panel title="Add a game">
        <div className="grid grid-3">
          <div className="field"><label>Name</label><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Game name" /></div>
          <div className="field"><label>Executable hint</label><input type="text" value={newExe} onChange={(e) => setNewExe(e.target.value)} placeholder="game.exe" /></div>
          <div className="field"><label>Launcher</label><select value={newLauncher} onChange={(e) => setNewLauncher(e.target.value as Launcher)}>{LAUNCHERS.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn primary" onClick={add}>Add</button>
          <button className="btn ghost" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      </Panel> : null}

      <div className="grid" style={{ gridTemplateColumns: "300px minmax(0,1fr)", marginTop: 14 }}>
        <Panel title={`Library (${state.games.length}) — ${DATABASE_GAME_COUNT} structured profiles`}>
          <div className="search" style={{ marginBottom: 10 }}><Search size={15} /><input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search games, hints, features" /></div>
          <div className="grid grid-3" style={{ gap: 6, marginBottom: 10 }}>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category">
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={launcherFilter} onChange={(e) => setLauncherFilter(e.target.value)} aria-label="Filter by launcher">
              <option value="all">All launchers</option>
              {libraryLaunchers.map((launcher) => <option key={launcher} value={launcher}>{launcher}</option>)}
            </select>
            <select value={detectionFilter} onChange={(e) => setDetectionFilter(e.target.value)} aria-label="Filter by detection status">
              <option value="all">All detection</option>
              <option value="verified">Verified</option>
              <option value="partial">Partial</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div style={{ maxHeight: 560, overflowY: "auto" }}>
            {games.slice(0, 400).map((game) => (
              <button key={game.id} className={`nav-item ${selectedId === game.id ? "active" : ""}`} onClick={() => setSelectedId(game.id)}>
                {game.verifiedDetection ? <ShieldCheck size={14} color="var(--vy-success)" /> : <ShieldAlert size={14} color="var(--vy-text-muted)" />}
                <span className="nav-text">{game.name}<small className="tiny" style={{ display: "block" }}>{game.category ?? "manual"} · {game.launcher} · {game.detectionConfidence ?? "manual"}</small></span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={selected ? selected.name : "Select a game"}>
          {!selected ? <EmptyState icon={Gamepad2} title="No game selected" detail="Pick a title from the library or add a manual entry." /> : (
            <>
              <div className="row"><span className="muted">Category</span><b>{selected.category ?? "manual entry"}</b></div>
              <div className="row"><span className="muted">Launcher</span><b className="mono">{(selected.launchers ?? [selected.launcher]).join(", ")}</b></div>
              <div className="row"><span className="muted">Detection</span><span className={`badge ${selected.verifiedDetection ? "success" : "warning"}`}>{selected.detectionConfidence ?? (selected.verifiedDetection ? "verified" : "manual")}</span></div>
              <div className="row"><span className="muted">Verification</span><b className="mono">{selected.verificationStatus ?? "unverified"}</b></div>
              <div className="row"><span className="muted">Configuration status</span><b className="mono">{selected.configurationStatus ?? "manual"}</b></div>
              <div className="row"><span className="muted">Release status</span><b className="mono">{selected.releaseStatus ?? "unknown"}</b></div>
              <div className="row"><span className="muted">Supported features</span><span className="mono">{selected.supportedFeatures?.join(", ") || "color, display, monitoring, restoration"}</span></div>
              <div className="row"><span className="muted">Executable hints</span><b className="mono">{selected.executableHints.join(", ") || "none"}</b></div>
              <div className="row"><span className="muted">Saved profile</span><b className="mono">{profile?.name ?? "none"}</b></div>
              <div style={{ marginTop: 16 }}>
                {COLOR_FIELDS.map((field) => (
                  <ParamSlider key={field} label={field} value={makeProfile(selected).color[field]} min={field === "hue" ? 0 : 0} max={field === "hue" ? 360 : field === "gamma" ? 250 : 300}
                    onChange={(value) => upsertProfile({ ...makeProfile(selected), color: { ...makeProfile(selected).color, [field]: value } })} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                <button className="btn primary" onClick={save}>Save profile</button>
                <button className="btn" onClick={() => { const p = makeProfile(selected); upsertProfile({ ...p, id: `profile-${p.gameId}-copy-${Date.now()}`, name: `${p.name} copy` }); notify("Profile duplicated"); }}><Copy size={14} /> Duplicate</button>
                <button className="btn" onClick={() => { upsertProfile({ ...makeProfile(selected), color: { ...state.color } }); notify("Profile reset to current colors"); }}><RotateCcw size={14} /> Reset</button>
                <button className="btn" onClick={() => downloadText(`${selected.id}-profile.json`, JSON.stringify(makeProfile(selected), null, 2))}><Download size={14} /> Export</button>
                {profile ? <button className="btn danger" onClick={() => { removeProfile(profile.id); notify("Profile removed"); }}><Trash2 size={14} /> Remove profile</button> : null}
                {!selected.configurationSource ? <button className="btn danger" onClick={() => { removeGame(selected.id); setSelectedId(null); }}><Trash2 size={14} /> Remove game</button> : null}
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}

