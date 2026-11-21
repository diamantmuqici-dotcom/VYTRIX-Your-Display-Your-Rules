import { useMemo, useState } from "react";
import { Layers, Plus, Trash2, Download, Play, Minus } from "lucide-react";
import type { CrosshairDesign } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { Panel, PageHead, EmptyState } from "@/components/ui/Panel";
import { CrosshairRenderer } from "@/crosshair/renderer";
import { exportCollectionText } from "@/crosshair/io";
import { normalizeDesign } from "@/crosshair/validate";
import type { StudioProps } from "./shared";

const BUILTIN_COLLECTION_IDS = new Set([
  "collection-competitive", "collection-minimal", "collection-creative",
]);

function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function allDesigns(crosshairs: CrosshairDesign[], presets: CrosshairDesign[]): CrosshairDesign[] {
  const map = new Map<string, CrosshairDesign>();
  for (const item of [...presets, ...crosshairs]) {
    if (!map.has(item.id)) map.set(item.id, normalizeDesign(item));
  }
  return [...map.values()];
}

export default function Collections({ selectDesign }: StudioProps) {
  const app = useApp();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const designs = useMemo(() => allDesigns(app.state.crosshairs, app.state.crosshairPresets), [app.state.crosshairs, app.state.crosshairPresets]);

  const toggle = (id: string) => setSelected((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(0, 100),
  );

  const create = () => {
    const clean = name.trim().slice(0, 80);
    if (!clean || selected.length === 0) return;
    app.upsertCrosshairCollection({
      id: `collection-${Date.now()}`,
      name: clean,
      designIds: [...selected],
      createdAt: Date.now(),
    });
    setName("");
    setSelected([]);
    app.log(`Crosshair collection created: ${clean}`);
  };

  const exportCollection = (id: string) => {
    const collection = app.state.crosshairCollections.find((item) => item.id === id);
    if (!collection) return;
    const items = collection.designIds
      .map((designId) => designs.find((item) => item.id === designId))
      .filter((item): item is CrosshairDesign => Boolean(item));
    downloadText(`${collection.name.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase()}.vytrix-crosshairs.json`, exportCollectionText(collection.name, items));
    app.log(`Collection exported: ${collection.name}`);
  };

  return (
    <div>
      <PageHead
        title="Crosshair collections"
        description="Group designs into local collections. Collections share the same versioned, hash-verified transfer format as individual designs."
      />
      <div className="grid" style={{ gridTemplateColumns: "minmax(320px,1fr) minmax(280px,380px)", gap: 14, alignItems: "start" }}>
        <Panel title="Your collections" icon={Layers}>
          {app.state.crosshairCollections.length === 0 ? (
            <EmptyState icon={Layers} title="No collections" detail="Select designs and create the first collection." />
          ) : app.state.crosshairCollections.map((collection) => {
            const items = collection.designIds
              .map((id) => designs.find((item) => item.id === id))
              .filter((item): item is CrosshairDesign => Boolean(item));
            const builtIn = BUILTIN_COLLECTION_IDS.has(collection.id);
            return (
              <div className="card" key={collection.id} style={{ marginBottom: 10 }}>
                <div className="row" style={{ padding: 0, border: 0 }}>
                  <strong>{collection.name}</strong>
                  <div style={{ display: "flex", gap: 6 }}>
                    {builtIn ? <span className="badge">built-in</span> : null}
                    <button className="btn ghost icon" onClick={() => exportCollection(collection.id)} title="Export collection"><Download size={13} /></button>
                    {!builtIn ? (
                      <button className="btn danger icon" onClick={() => app.removeCrosshairCollection(collection.id)} title="Delete collection"><Trash2 size={13} /></button>
                    ) : null}
                  </div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))", gap: 8, marginTop: 10 }}>
                  {items.map((item) => (
                    <button key={item.id} className="btn ghost" style={{ padding: 6 }} onClick={() => selectDesign(item)} title={item.name}>
                      <CrosshairRenderer design={item} size={74} background="dark" animate={false} />
                      <span className="tiny" style={{ display: "block", marginTop: 4 }}>{item.name.slice(0, 14)}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </Panel>

        <Panel title="Create collection" icon={Plus}>
          <div className="field"><label>Collection name</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="My set" /></div>
          <div className="tiny" style={{ marginBottom: 8 }}>{selected.length} design{selected.length === 1 ? "" : "s"} selected</div>
          <div style={{ maxHeight: 420, overflow: "auto" }}>
            {designs.map((item) => (
              <div className="row" key={item.id}>
                <button className="btn ghost" onClick={() => toggle(item.id)}>
                  {selected.includes(item.id) ? <Minus size={13} /> : <Plus size={13} />}
                  <span>{item.name}</span>
                </button>
                <button className="btn ghost icon" onClick={() => selectDesign(item)} title="Apply"><Play size={13} /></button>
              </div>
            ))}
          </div>
          <button className="btn primary" style={{ marginTop: 10 }} onClick={create} disabled={!name.trim() || selected.length === 0}>
            <Plus size={14} /> Create collection
          </button>
        </Panel>
      </div>
    </div>
  );
}
