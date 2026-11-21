import { useState } from "react";
import { motion } from "framer-motion";
import {
  Crosshair as CrosshairIcon, Pencil, Library, Shuffle, Upload, Save, Star,
  Clock3, Layers, Play, Plus,
} from "lucide-react";
import { useApp } from "@/stores/app";
import { useT } from "@/i18n";
import { Panel, EmptyState } from "@/components/ui/Panel";
import { CrosshairRenderer, type PreviewBackground } from "@/crosshair/renderer";
import { randomizeDesign, type RandomScope } from "@/crosshair/random";
import { SHAPE_DETAIL } from "@/crosshair/model";
import { cloneDesign } from "@/crosshair/validate";
import type { StudioProps } from "./shared";

export default function Dashboard({ design, setDesign, selectDesign, commit }: StudioProps) {
  const app = useApp();
  const t = useT();
  const [scope, setScope] = useState<RandomScope>("all");
  const recent = app.state.crosshairRecent
    .map((item) => app.state.crosshairs.find((designItem) => designItem.id === item.id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const favorites = app.state.crosshairPresets.filter((item) => item.favorite);
  const background = app.state.crosshairStudio.previewBackground as PreviewBackground;

  const create = () => {
    const fresh = cloneDesign(design, `design-${Date.now()}`, "New crosshair");
    commit(fresh);
    app.setCrosshairTab("editor");
  };
  const duplicate = () => {
    const copy = cloneDesign(design, `design-${Date.now()}`, `${design.name} v2`);
    commit(copy);
  };
  const randomize = () => {
    const next = randomizeDesign(design, scope);
    setDesign(next);
    app.log("Crosshair randomized");
  };
  const activateProfile = (gameId: string) => {
    const profile = app.state.crosshairGameProfiles.find((item) => item.gameId === gameId);
    const target = profile ? app.state.crosshairs.find((item) => item.id === profile.designId) : undefined;
    if (target) selectDesign(target);
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(0,1.4fr) minmax(320px,1fr)", gap: 14 }}>
      <Panel title="Active crosshair" icon={CrosshairIcon} action={<span className="badge success">live</span>}>
        <motion.div
          key={`${design.id}-${design.color}-${design.advanced.shape}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          style={{ display: "flex", justifyContent: "center" }}
        >
          <CrosshairRenderer design={design} size={320} background={background} zoom={1} />
        </motion.div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8, marginTop: 14 }}>
          <div className="card"><div className="metric" style={{ fontSize: 15 }}>{design.name}</div><div className="metric-label">Design</div></div>
          <div className="card"><div className="metric" style={{ fontSize: 15, color: design.color }}>{design.color}</div><div className="metric-label">Color</div></div>
          <div className="card"><div className="metric" style={{ fontSize: 15 }}>{design.advanced.shape}</div><div className="metric-label">Shape</div></div>
          <div className="card"><div className="metric" style={{ fontSize: 15 }}>{design.advanced.outline.enabled ? "on" : "off"}</div><div className="metric-label">Outline</div></div>
        </div>
        <div className="tiny" style={{ marginTop: 10, lineHeight: 1.6 }}>
          {SHAPE_DETAIL[design.advanced.shape]} · center dot {design.advanced.dot.enabled ? "enabled" : "disabled"} ·
          active profile: {app.state.crosshairGameProfiles.find((item) => item.designId === design.id)?.gameName ?? "none"}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <button className="btn primary" onClick={create}><Plus size={14} /> {t("crosshair.create")}</button>
          <button className="btn" onClick={() => app.setCrosshairTab("editor")}><Pencil size={14} /> {t("crosshair.editCurrent")}</button>
          <button className="btn" onClick={() => app.setCrosshairTab("presets")}><Library size={14} /> {t("crosshair.browsePresets")}</button>
          <button className="btn" onClick={() => app.setCrosshairTab("import-export")}><Upload size={14} /> {t("common.import")}</button>
        </div>
      </Panel>

      <div className="grid" style={{ gap: 14, alignContent: "start" }}>
        <Panel title="Randomize" icon={Shuffle}>
          <div className="field">
            <label>Scope</label>
            <select value={scope} onChange={(event) => setScope(event.target.value as RandomScope)}>
              <option value="all">Entire crosshair</option>
              <option value="shape">Shape only</option>
              <option value="color">Colors only</option>
              <option value="size">Size only</option>
              <option value="elements">Individual elements</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" onClick={randomize}><Shuffle size={14} /> Randomize</button>
            <button className="btn" onClick={duplicate}><Save size={14} /> Save new version</button>
          </div>
        </Panel>

        <Panel title="Recently used" icon={Clock3}>
          {recent.length === 0 ? <EmptyState icon={Clock3} title="No recent designs" detail="Designs you apply appear here." /> : (
            recent.map((item) => (
              <div className="row" key={item.id}>
                <button className="btn ghost" onClick={() => selectDesign(item)}><Play size={13} /> {item.name}</button>
                <span className="tiny">{item.advanced.shape}</span>
              </div>
            ))
          )}
        </Panel>

        <Panel title="Favorite presets" icon={Star}>
          {favorites.length === 0 ? <EmptyState icon={Star} title="No favorites" detail="Star a preset to pin it here." /> : (
            favorites.map((item) => (
              <div className="row" key={item.id}>
                <button className="btn ghost" onClick={() => selectDesign(item)}><Star size={13} /> {item.name}</button>
                <span className="tiny">{item.category}</span>
              </div>
            ))
          )}
        </Panel>

        <Panel title="Game profiles" icon={Layers}>
          {app.state.crosshairGameProfiles.length === 0 ? (
            <EmptyState icon={Layers} title="No game profiles" detail="Assign a crosshair to a game in Game Profiles." />
          ) : app.state.crosshairGameProfiles.slice(0, 6).map((profile) => (
            <div className="row" key={profile.id}>
              <button className="btn ghost" onClick={() => activateProfile(profile.gameId)}>{profile.gameName}</button>
              <span className="badge">{profile.autoSwitch ? "auto" : "manual"}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
