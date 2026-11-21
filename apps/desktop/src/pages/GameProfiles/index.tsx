import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Copy, Trash2, Download, RotateCcw, ShieldCheck, ShieldAlert, Gamepad2 } from "lucide-react";
import type { GameEntry, GameProfile, Launcher } from "@vytrix/shared-types";
import { DATABASE_GAME_COUNT } from "@/data/games";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { isTauriRuntime, invokeNative } from "@/services/tauri";
import { applyColorNow } from "@/services/color";
import { Panel, PageHead, EmptyState } from "@/components/ui/Panel";
import { ParamSlider } from "@/components/sliders/ParamSlider";
import { downloadText } from "@/utils/download";
import { useT } from "@/i18n";

const LAUNCHERS: Launcher[] = ["steam", "epic", "riot", "xbox", "microsoft-store", "battle-net", "ubisoft-connect", "ea-app", "manual"];
const COLOR_FIELDS = ["saturation", "vibrance", "gamma", "brightness", "contrast", "hue"] as const;

interface SteamInstallation {
  appId: string;
  name: string;
  installDir: string;
  executables: string[];
}

export default function GameProfiles() {
  const { state, addGame, removeGame, upsertProfile, removeProfile, log } = useApp();
  const { notify } = useToast();
  const t = useT();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [launcherFilter, setLauncherFilter] = useState("all");
  const [detectionFilter, setDetectionFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExe, setNewExe] = useState("");
  const [newLauncher, setNewLauncher] = useState<Launcher>("manual");
  const [steamInstallations, setSteamInstallations] = useState<SteamInstallation[]>([]);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    invokeNative<SteamInstallation[]>("steam_installations").then((result) => {
      if (active && result.ok) setSteamInstallations(result.data);
    });
    return () => { active = false; };
  }, []);

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

  const steamMatch = useMemo(() => {
    if (!selected || !(selected.launchers ?? [selected.launcher]).includes("steam")) return null;
    const wanted = selected.name.trim().toLocaleLowerCase();
    const hints = selected.executableHints.map((value) => value.trim().toLocaleLowerCase());
    return steamInstallations.find((installation) =>
      installation.name.trim().toLocaleLowerCase() === wanted
      || hints.some((hint) => installation.executables.some((executable) => executable.toLocaleLowerCase() === hint)),
    ) ?? null;
  }, [selected, steamInstallations]);

  const makeProfile = (game: GameEntry): GameProfile => profile ?? {
    id: `profile-${game.id}`, gameId: game.id, name: game.name, color: { ...state.color },
    resolution: null, applyCrosshair: false, crosshairId: null,
    performanceNote: "No game files are modified.", autoSwitch: state.settings.autoGameSwitch,
  };

  const save = () => {
    if (!selected) return;
    upsertProfile(makeProfile(selected));
    log(`Saved profile for ${selected.name}`);
    notify(`${t("game.profileSaved")}: ${selected.name}`);
  };

  const applyProfile = () => {
    const color = profile?.color ?? state.color;
    void applyColorNow(color).then((status) => {
      notify(status?.ok ? t("game.profileApplied") : t("color.applyFailed"), status?.ok ? undefined : "error");
    });
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
    notify(t("game.addedManual"));
  };

  return (
    <div className="page">
      <PageHead title={t("game.title")} description={t("game.subtitle")}
        action={<button className="btn primary" onClick={() => setAdding(true)}><Plus size={15} /> {t("game.addGame")}</button>} />

      {adding ? <Panel title={t("game.addTitle")}>
        <div className="grid grid-3">
          <div className="field"><label>{t("common.name")}</label><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Game name" /></div>
          <div className="field"><label>{t("game.exeHint")}</label><input type="text" value={newExe} onChange={(e) => setNewExe(e.target.value)} placeholder="game.exe" /></div>
          <div className="field"><label>{t("game.launcher")}</label><select value={newLauncher} onChange={(e) => setNewLauncher(e.target.value as Launcher)}>{LAUNCHERS.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn primary" onClick={add}>{t("common.add")}</button>
          <button className="btn ghost" onClick={() => setAdding(false)}>{t("common.cancel")}</button>
        </div>
      </Panel> : null}

      <div className="grid" style={{ gridTemplateColumns: "300px minmax(0,1fr)", marginTop: 14 }}>
        <Panel title={`${t("game.library")} (${state.games.length}) — ${DATABASE_GAME_COUNT} ${t("game.structuredProfiles")}`}>
          <div className="search" style={{ marginBottom: 10 }}><Search size={15} /><input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("game.search")} /></div>
          <div className="grid grid-3" style={{ gap: 6, marginBottom: 10 }}>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label={t("game.category")}>
              <option value="all">{t("game.allCategories")}</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={launcherFilter} onChange={(e) => setLauncherFilter(e.target.value)} aria-label={t("game.launcher")}>
              <option value="all">{t("game.allLaunchers")}</option>
              {libraryLaunchers.map((launcher) => <option key={launcher} value={launcher}>{launcher}</option>)}
            </select>
            <select value={detectionFilter} onChange={(e) => setDetectionFilter(e.target.value)} aria-label={t("game.detection")}>
              <option value="all">{t("game.allDetection")}</option>
              <option value="verified">{t("common.verified")}</option>
              <option value="partial">{t("common.partial")}</option>
              <option value="manual">{t("common.manual")}</option>
            </select>
          </div>
          <div style={{ maxHeight: 560, overflowY: "auto" }}>
            {games.slice(0, 400).map((game) => (
              <button key={game.id} className={`nav-item ${selectedId === game.id ? "active" : ""}`} onClick={() => setSelectedId(game.id)}>
                {game.verifiedDetection ? <ShieldCheck size={14} color="var(--vy-success)" /> : <ShieldAlert size={14} color="var(--vy-text-muted)" />}
                <span className="nav-text">{game.name}<small className="tiny" style={{ display: "block" }}>{game.category ?? t("game.manualEntry")} · {game.launcher} · {game.detectionConfidence ?? "manual"}</small>{game.detail ? <small className="tiny" style={{ display: "block", opacity: 0.78 }}>{game.detail}</small> : null}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={selected ? selected.name : t("game.selectGame")}>
          {!selected ? <EmptyState icon={Gamepad2} title={t("game.noGameSelected")} detail={t("game.pickGame")} /> : (
            <>
              <div className="row"><span className="muted">{t("game.category")}</span><b>{selected.category ?? t("game.manualEntry")}</b></div>
              {selected.detail ? <div className="row"><span className="muted">{t("game.howTo")}</span><span className="tiny">{selected.detail}</span></div> : null}
              <div className="row"><span className="muted">{t("game.launcher")}</span><b className="mono">{(selected.launchers ?? [selected.launcher]).join(", ")}</b></div>
              <div className="row"><span className="muted">{t("game.library")}</span><span className={`badge ${steamMatch ? "success" : "warning"}`}>{steamMatch ? t("game.steamInstalled") : t("game.steamMissing")}</span></div>
              <div className="row"><span className="muted">{t("game.detection")}</span><span className={`badge ${selected.verifiedDetection ? "success" : "warning"}`}>{selected.detectionConfidence ?? (selected.verifiedDetection ? "verified" : "manual")}</span></div>
              <div className="row"><span className="muted">{t("game.verification")}</span><b className="mono">{selected.verificationStatus ?? "unverified"}</b></div>
              <div className="row"><span className="muted">{t("game.configStatus")}</span><b className="mono">{selected.configurationStatus ?? "manual"}</b></div>
              <div className="row"><span className="muted">{t("game.releaseStatus")}</span><b className="mono">{selected.releaseStatus ?? "unknown"}</b></div>
              <div className="row"><span className="muted">{t("game.supportedFeatures")}</span><span className="mono">{selected.supportedFeatures?.join(", ") || "color, display, monitoring, restoration"}</span></div>
              <div className="row"><span className="muted">{t("game.executableHints")}</span><b className="mono">{selected.executableHints.join(", ") || "none"}</b></div>
              <div className="row"><span className="muted">{t("game.savedProfile")}</span><b className="mono">{profile?.name ?? "none"}</b></div>
              <div style={{ marginTop: 16 }}>
                {COLOR_FIELDS.map((field) => (
                  <ParamSlider key={field} label={field} value={makeProfile(selected).color[field]} min={field === "hue" ? 0 : 0} max={field === "hue" ? 360 : field === "gamma" ? 250 : 300}
                    onChange={(value) => upsertProfile({ ...makeProfile(selected), color: { ...makeProfile(selected).color, [field]: value } })} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                <button className="btn primary" onClick={applyProfile}>{t("game.applyProfile")}</button>
                <button className="btn primary" onClick={save}>{t("game.saveProfile")}</button>
                <button className="btn" onClick={() => { const p = makeProfile(selected); upsertProfile({ ...p, id: `profile-${p.gameId}-copy-${Date.now()}`, name: `${p.name} copy` }); notify(t("game.profileDuplicated")); }}><Copy size={14} /> {t("game.duplicate")}</button>
                <button className="btn" onClick={() => { upsertProfile({ ...makeProfile(selected), color: { ...state.color } }); notify(t("game.profileReset")); }}><RotateCcw size={14} /> {t("game.profileResetButton")}</button>
                <button className="btn" onClick={() => downloadText(`${selected.id}-profile.json`, JSON.stringify(makeProfile(selected), null, 2))}><Download size={14} /> {t("common.export")}</button>
                {profile ? <button className="btn danger" onClick={() => { removeProfile(profile.id); notify(t("game.removeProfile")); }}><Trash2 size={14} /> {t("game.removeProfile")}</button> : null}
                {!selected.configurationSource ? <button className="btn danger" onClick={() => { removeGame(selected.id); setSelectedId(null); }}><Trash2 size={14} /> {t("game.removeGame")}</button> : null}
              </div>
              {steamMatch ? <div className="tiny" style={{ marginTop: 10 }}>{t("game.steamInstalled")}: {steamMatch.name} · {steamMatch.installDir}</div> : null}
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
