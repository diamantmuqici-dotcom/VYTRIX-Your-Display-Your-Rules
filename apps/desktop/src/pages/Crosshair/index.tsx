import { useCallback, useEffect, useMemo, useState } from "react";
import { Crosshair as CrosshairIcon } from "lucide-react";
import type { CrosshairAdvanced, CrosshairDesign } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useT } from "@/i18n";
import { PageHead } from "@/components/ui/Panel";
import { DEFAULT_DESIGN } from "@/crosshair/model";
import { normalizeDesign } from "@/crosshair/validate";
import { setOverlayCrosshair } from "@/services/overlay";
import Dashboard from "./Dashboard";
import Editor from "./Editor";
import Presets from "./Presets";
import Animated from "./Animated";
import Profiles from "./Profiles";
import Collections from "./Collections";
import ImportExport from "./ImportExport";
import StudioSettings from "./Settings";
import type { StudioProps } from "./shared";

const TABS = ["overview", "editor", "presets", "animated", "profiles", "collections", "import-export", "settings"] as const;

export default function Crosshair() {
  const app = useApp();
  const t = useT();
  const [design, setDesignState] = useState<CrosshairDesign>(() => {
    const preferred = app.state.crosshairs.find((item) => item.id === app.state.crosshairStudio.defaultDesignId);
    return preferred ? normalizeDesign(preferred) : normalizeDesign(DEFAULT_DESIGN);
  });
  const [zoom, setZoom] = useState(1);
  const tab = TABS.includes(app.state.crosshairTab as typeof TABS[number]) ? app.state.crosshairTab : "overview";

  const setDesign = useCallback((next: CrosshairDesign) => setDesignState(normalizeDesign(next)), []);
  const patchAdvanced = useCallback((patch: Partial<CrosshairAdvanced>) => {
    setDesignState((current) => normalizeDesign({
      ...current,
      advanced: { ...current.advanced, ...patch },
    }));
  }, []);

  const commit = useCallback((next?: CrosshairDesign) => {
    const target = normalizeDesign(next ?? design);
    setDesignState(target);
    app.setCrosshairDesign(target);
    app.markCrosshairUsed(target.id);
    void setOverlayCrosshair(target);
    app.log(`Crosshair saved: ${target.name}`);
  }, [app, design]);

  const selectDesign = useCallback((next: CrosshairDesign) => {
    const target = normalizeDesign(next);
    setDesignState(target);
    app.markCrosshairUsed(target.id);
    void setOverlayCrosshair(target);
  }, [app]);

  useEffect(() => {
    if (!app.state.crosshairStudio.overlayStartEnabled) return;
    void setOverlayCrosshair(design);
  }, [app.state.crosshairStudio.overlayStartEnabled, design]);

  const props: StudioProps = useMemo(() => ({
    design, setDesign, patchAdvanced, commit, selectDesign, zoom, setZoom,
  }), [design, setDesign, patchAdvanced, commit, selectDesign, zoom]);

  const Pages: Record<string, () => React.JSX.Element> = {
    overview: () => <Dashboard {...props} />,
    editor: () => <Editor {...props} />,
    presets: () => <Presets {...props} />,
    animated: () => <Animated {...props} />,
    profiles: () => <Profiles {...props} />,
    collections: () => <Collections {...props} />,
    "import-export": () => <ImportExport {...props} />,
    settings: () => <StudioSettings {...props} />,
  };
  const ActivePage = Pages[tab] ?? Dashboard;

  return (
    <div className="page">
      <PageHead
        title="Crosshair Studio"
        description="Build, preview, save and assign original crosshair designs. The overlay is drawn by VYTRIX and never injects into a game."
        action={<span className="badge accent"><CrosshairIcon size={12} /> {t("crosshair.studio")}</span>}
      />
      <div className="tabs" role="tablist" aria-label="Crosshair Studio sections">
        {TABS.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            className={`tab ${tab === item ? "active" : ""}`}
            onClick={() => app.setCrosshairTab(item)}
          >
            {t(`crosshair.tab.${item}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>
      <ActivePage {...props} />
    </div>
  );
}
