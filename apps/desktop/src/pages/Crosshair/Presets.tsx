import { useMemo, useState } from "react";
import { Search, Star, Pencil, Copy, Trash2, Play, Plus } from "lucide-react";
import { useApp } from "@/stores/app";
import { Panel, PageHead, EmptyState } from "@/components/ui/Panel";
import { CrosshairRenderer } from "@/crosshair/renderer";
import { PRESET_CATEGORIES, SHAPES } from "@/crosshair/model";
import { cloneDesign } from "@/crosshair/validate";
import { COLOR_PRESETS } from "@/crosshair/model";
import type { CrosshairPreset } from "@/crosshair/model";
import type { StudioProps } from "./shared";

export default function Presets({ design, selectDesign }: StudioProps) {
  const app = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [shape, setShape] = useState("All");
  const [color, setColor] = useState("All");
  const [size, setSize] = useState("All");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);

  const recentIds = new Set(app.state.crosshairRecent.map((item) => item.id));
  const filtered = useMemo(() => app.state.crosshairPresets.filter((preset) => {
    if (search && !`${preset.name} ${preset.description ?? ""} ${preset.category ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== "All" && preset.category !== category) return false;
    if (shape !== "All" && preset.advanced.shape !== shape) return false;
    if (color !== "All" && preset.color.toUpperCase() !== color) return false;
    if (size !== "All") {
      const length = preset.length;
      if (size === "Small" && length > 8) return false;
      if (size === "Large" && length < 13) return false;
      if (size === "Medium" && (length <= 8 || length >= 13)) return false;
    }
    if (favoritesOnly && !preset.favorite) return false;
    if (recentOnly && !recentIds.has(preset.id)) return false;
    return true;
  }), [app.state.crosshairPresets, search, category, shape, color, size, favoritesOnly, recentOnly, app.state.crosshairRecent]);

  const apply = (preset: CrosshairPreset) => selectDesign(preset);
  const editCopy = (preset: CrosshairPreset) => {
    const copy = cloneDesign(preset, `design-${Date.now()}`, `${preset.name} copy`);
    selectDesign(copy);
    app.setCrosshairTab("editor");
  };
  const saveModifiedCopy = () => {
    const preset: CrosshairPreset = {
      ...cloneDesign(design, `preset-${Date.now()}`, `${design.name} copy`),
      category: "Custom",
      description: "Saved from current design",
      favorite: false,
      builtIn: false,
    };
    app.upsertCrosshairPreset(preset);
    app.log(`Preset saved: ${preset.name}`);
  };
  const rename = (preset: CrosshairPreset) => {
    const name = window.prompt("Preset name", preset.name);
    if (!name) return;
    app.upsertCrosshairPreset({ ...preset, name: name.slice(0, 80) });
  };

  return (
    <div>
      <PageHead title="Preset library" description="Original VYTRIX designs. Applying a preset never edits the stored original; duplicates are always editable copies." />
      <Panel title="Filters" icon={Search}>
        <div className="search" style={{ marginBottom: 10 }}><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search presets" /></div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 8 }}>
          <div className="field"><label>Category</label><select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All</option>{PRESET_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select></div>
          <div className="field"><label>Shape</label><select value={shape} onChange={(e) => setShape(e.target.value)}>
            <option>All</option>{SHAPES.map((item) => <option key={item}>{item}</option>)}
          </select></div>
          <div className="field"><label>Color</label><select value={color} onChange={(e) => setColor(e.target.value)}>
            <option>All</option>{COLOR_PRESETS.map((item) => <option key={item.value} value={item.value}>{item.name}</option>)}
          </select></div>
          <div className="field"><label>Size</label><select value={size} onChange={(e) => setSize(e.target.value)}>
            <option>All</option><option>Small</option><option>Medium</option><option>Large</option>
          </select></div>
          <div className="field"><label>Style</label><select value={favoritesOnly ? "favorites" : recentOnly ? "recent" : "all"} onChange={(e) => {
            setFavoritesOnly(e.target.value === "favorites");
            setRecentOnly(e.target.value === "recent");
          }}>
            <option value="all">All</option><option value="favorites">Favorites</option><option value="recent">Recently used</option>
          </select></div>
        </div>
        <button className="btn primary" onClick={saveModifiedCopy}><Plus size={14} /> Save current as preset</button>
      </Panel>

      <div style={{ marginTop: 14 }}>
        {filtered.length === 0 ? <EmptyState icon={Search} title="No matching presets" detail="Change a filter or save the current design as a new preset." /> : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
            {filtered.map((preset) => (
              <div className="card" key={preset.id}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <CrosshairRenderer design={preset} size={150} background="dark" animate={false} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <strong>{preset.name}</strong>
                  <button className={`btn ghost icon ${preset.favorite ? "active" : ""}`} onClick={() => app.toggleCrosshairFavorite(preset.id)} aria-label="Favorite">
                    <Star size={14} fill={preset.favorite ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="tiny" style={{ lineHeight: 1.5, minHeight: 32 }}>{preset.description ?? ""}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  <span className="badge">{preset.category ?? "Custom"}</span>
                  <span className="badge" style={{ color: preset.color }}>{preset.color}</span>
                  <span className="badge">{preset.advanced.shape}</span>
                  {preset.builtIn ? <span className="badge">built-in</span> : null}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button className="btn primary" onClick={() => apply(preset)}><Play size={13} /> Apply</button>
                  <button className="btn" onClick={() => editCopy(preset)}><Pencil size={13} /> Edit</button>
                  <button className="btn ghost icon" onClick={() => {
                    const copy = cloneDesign(preset, `preset-${Date.now()}`, `${preset.name} copy`);
                    app.upsertCrosshairPreset({ ...copy, category: "Custom", description: `Copy of ${preset.name}`, favorite: false, builtIn: false });
                  }} title="Duplicate"><Copy size={13} /></button>
                  {!preset.builtIn ? <button className="btn ghost icon" onClick={() => rename(preset)} title="Rename"><Pencil size={13} /></button> : null}
                  {!preset.builtIn ? <button className="btn danger icon" onClick={() => app.removeCrosshairPreset(preset.id)} title="Delete"><Trash2 size={13} /></button> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
