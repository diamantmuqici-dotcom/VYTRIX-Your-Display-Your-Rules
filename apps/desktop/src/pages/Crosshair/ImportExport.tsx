import { useState } from "react";
import { Download, Upload, Clipboard, FileJson, ShieldCheck, Layers, Gamepad2 } from "lucide-react";
import type { CrosshairGameProfile } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { Panel, PageHead } from "@/components/ui/Panel";
import { CrosshairRenderer } from "@/crosshair/renderer";
import {
  exportCollectionText, exportDesignCode, exportDesignText, exportProfilesText,
  importCollectionText, importDesignCode, importDesignText, importProfilesText,
} from "@/crosshair/io";
import type { StudioProps } from "./shared";

type Mode = "design" | "collection" | "profiles";

function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ImportExport({ design, selectDesign }: StudioProps) {
  const app = useApp();
  const [mode, setMode] = useState<Mode>("design");
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const designJson = () => exportDesignText(design);
  const designShare = () => exportDesignCode(design);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Copied to clipboard");
      setError("");
    } catch {
      setError("Clipboard unavailable in this runtime");
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setText(await file.text());
    setError("");
    setMessage(`${file.name} loaded`);
  };

  const importText = () => {
    setError("");
    setMessage("");
    try {
      if (mode === "design") {
        const next = importDesignText(text);
        selectDesign(next);
        app.setCrosshairDesign(next);
        setMessage(`Imported design: ${next.name}`);
      } else if (mode === "collection") {
        const collection = importCollectionText(text);
        for (const item of collection.designs) app.setCrosshairDesign(item);
        app.upsertCrosshairCollection({
          id: `collection-${Date.now()}`,
          name: collection.name,
          designIds: collection.designs.map((item) => item.id),
          createdAt: Date.now(),
        });
        setMessage(`Imported collection: ${collection.name}`);
      } else {
        const profiles = importProfilesText(text);
        for (const profile of profiles) app.upsertCrosshairGameProfile(profile);
        setMessage(`Imported ${profiles.length} game profile${profiles.length === 1 ? "" : "s"}`);
      }
      app.log(message || "Crosshair import completed");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import failed");
    }
  };

  const importCode = () => {
    setError("");
    setMessage("");
    try {
      const next = importDesignCode(code);
      selectDesign(next);
      app.setCrosshairDesign(next);
      setMessage(`Imported design: ${next.name}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Share code import failed");
    }
  };

  const exportCurrent = () => {
    if (mode === "design") {
      downloadText(`${design.name.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase() || "crosshair"}.vytrix-crosshair.json`, designJson());
    } else if (mode === "collection") {
      const items = app.state.crosshairCollections.flatMap((collection) =>
        collection.designIds
          .map((id) => app.state.crosshairs.find((item) => item.id === id) ?? app.state.crosshairPresets.find((item) => item.id === id))
          .filter((item): item is NonNullable<typeof item> => Boolean(item)),
      ).slice(0, 100);
      downloadText("vytrix-crosshair-collection.json", exportCollectionText("VYTRIX collection", items));
    } else {
      downloadText("vytrix-crosshair-profiles.json", exportProfilesText(app.state.crosshairGameProfiles));
    }
    app.log(`Exported ${mode}`);
  };

  const shareCodeValue = designShare();

  return (
    <div>
      <PageHead
        title="Import and export"
        description="Transfers use the versioned VYTRIX preset container with a content hash. Executable fields, paths and scripts are rejected before a design reaches the renderer."
      />
      <div className="grid" style={{ gridTemplateColumns: "minmax(300px,1fr) minmax(300px,1fr)", gap: 14, alignItems: "start" }}>
        <Panel title="Export" icon={Download}>
          <div className="field"><label>Type</label>
            <select value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
              <option value="design">Current design</option>
              <option value="collection">All collection designs</option>
              <option value="profiles">Game profiles</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
            <CrosshairRenderer design={design} size={180} background="dark" animate={false} />
          </div>
          <button className="btn primary" onClick={exportCurrent}><Download size={14} /> Download JSON</button>
          <div className="field" style={{ marginTop: 10 }}><label>Design JSON</label><textarea rows={7} readOnly value={mode === "design" ? designJson() : "Switch to Current design to export a single design."} /></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => void copy(mode === "design" ? designJson() : "")}><Clipboard size={14} /> Copy JSON</button>
          </div>
          <div className="field" style={{ marginTop: 10 }}><label>Share code</label><textarea rows={3} readOnly value={shareCodeValue} /></div>
          <button className="btn" onClick={() => void copy(shareCodeValue)}><Clipboard size={14} /> Copy share code</button>
        </Panel>

        <Panel title="Import" icon={Upload}>
          <div className="field"><label>Type</label>
            <select value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
              <option value="design">Design</option>
              <option value="collection">Collection</option>
              <option value="profiles">Game profiles</option>
            </select>
          </div>
          <div className="field"><label>JSON file</label><input type="file" accept=".json,application/json" onChange={(event) => void onFile(event.target.files?.[0])} /></div>
          <div className="field"><label>Paste JSON</label><textarea rows={7} value={text} onChange={(event) => setText(event.target.value)} placeholder="VYTRIX preset JSON" /></div>
          <button className="btn primary" onClick={importText} disabled={!text.trim()}><Upload size={14} /> Import file</button>
          <div className="field" style={{ marginTop: 12 }}><label>Design share code</label><textarea rows={3} value={code} onChange={(event) => setCode(event.target.value)} placeholder="VYTRIX1...." /></div>
          <button className="btn" onClick={importCode} disabled={!code.trim()}><Upload size={14} /> Import share code</button>
          {message ? <div className="notice" style={{ marginTop: 10 }}>{message}</div> : null}
          {error ? <div className="notice" style={{ marginTop: 10, color: "#ff6b6b" }}>{error}</div> : null}
        </Panel>

        <Panel title="Format guarantees" icon={ShieldCheck}>
          <div className="row"><FileJson size={14} /><span>Schema version 1 with content hash validation.</span></div>
          <div className="row"><ShieldCheck size={14} /><span>Numeric ranges are clamped before the renderer sees a design.</span></div>
          <div className="row"><Layers size={14} /><span>Collections and profiles are bounded and behavior-free.</span></div>
          <div className="row"><Gamepad2 size={14} /><span>Game profiles contain identifiers only, never paths or commands.</span></div>
          <div className="tiny" style={{ marginTop: 10, lineHeight: 1.6 }}>
            Imported IDs are preserved when valid, then normalized. A design with an advanced element model is rendered locally; the native overlay receives only sanitized fields it supports.
          </div>
        </Panel>
      </div>
    </div>
  );
}
