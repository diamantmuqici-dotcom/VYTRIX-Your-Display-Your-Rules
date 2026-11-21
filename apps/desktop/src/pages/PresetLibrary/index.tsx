import { useMemo, useState } from "react";
import { Search, Star, Download, Share2, Flag, Heart, Plus } from "lucide-react";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { PageHead, Panel, EmptyState } from "@/components/ui/Panel";
import { createPreset, serializePreset, shareCode } from "@vytrix/preset-format";
import { downloadText } from "@/utils/download";
import { LibraryBig } from "lucide-react";

const TABS = ["Featured", "Popular", "New", "Competitive", "Realistic", "Cinematic", "Community", "My Presets", "Favorites"];

export default function PresetLibrary() {
  const { state, applyPreset, toggleFavorite, log } = useApp();
  const { notify } = useToast();
  const [tab, setTab] = useState("Featured");
  const [query, setQuery] = useState("");

  const presets = useMemo(() => {
    let list = state.presets;
    if (tab === "Favorites") list = list.filter((p) => state.favorites.includes(p.id));
    if (tab === "My Presets") list = list.filter((p) => !p.builtIn);
    if (["Competitive", "Cinematic", "Realistic"].includes(tab)) list = list.filter((p) => p.category === tab);
    if (tab === "New") list = [...list].reverse();
    if (tab === "Community") list = [];
    return list.filter((p) => `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
  }, [state.presets, state.favorites, tab, query]);

  return (
    <div className="page">
      <PageHead title="Preset Library" description="Built-in and user-created looks. Community submissions are inert data, validated on import, and moderated before featuring." />
      <div className="tabs">{TABS.map((t) => <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>)}</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div className="search" style={{ width: 320 }}><Search size={15} /><input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search presets" /></div>
        <button className="btn" onClick={() => notify("Preset creation is available in Color Studio")}><Plus size={14} /> Create preset</button>
      </div>

      {presets.length === 0 ? <Panel title={tab}><EmptyState icon={LibraryBig} title="Nothing here yet" detail={tab === "Community" ? "Community library is empty until submissions are approved." : "Try another tab or search term."} /></Panel> : (
        <div className="grid grid-4">
          {presets.map((preset) => (
            <div className="card" key={preset.id}>
              <div style={{ height: 96, borderRadius: 10, background: preset.thumbnail, marginBottom: 12 }} />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>{preset.name}</strong>
                <button className="btn ghost icon" title="Favorite" onClick={() => toggleFavorite(preset.id)}>
                  <Heart size={15} color={state.favorites.includes(preset.id) ? "var(--vy-error)" : "currentColor"} />
                </button>
              </div>
              <div className="tiny" style={{ marginTop: 6, lineHeight: 1.5, minHeight: 42 }}>{preset.description}</div>
              <div style={{ display: "flex", gap: 6, margin: "10px 0", flexWrap: "wrap" }}>
                <span className="badge accent">{preset.category}</span>
                <span className="badge">{preset.builtIn ? "built-in" : "user"}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="btn primary" onClick={() => { applyPreset(preset); notify(`Applied ${preset.name}`); }}><Star size={13} /> Apply</button>
                <button className="btn icon" title="Download" onClick={() => downloadText(`${preset.id}.vytrixpreset`, serializePreset(createPreset({ kind: "color", name: preset.name, description: preset.description, author: "VYTRIX", payload: { ...preset.settings } })))}><Download size={13} /></button>
                <button className="btn icon" title="Share code" onClick={() => {
                  const code = shareCode(createPreset({ kind: "color", name: preset.name, description: preset.description, author: "VYTRIX", payload: { ...preset.settings } }));
                  void navigator.clipboard?.writeText(code); notify("Share code copied");
                }}><Share2 size={13} /></button>
                <button className="btn icon" title="Report" onClick={() => { log(`Report filed for ${preset.name}`); notify("Report recorded"); }}><Flag size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
