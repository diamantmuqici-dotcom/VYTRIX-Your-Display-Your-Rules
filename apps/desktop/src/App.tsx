import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, Boxes, Radio } from "lucide-react";
import { SECTION_DEFS } from "@/app/sections";
import { SECTION_BINDINGS } from "@/app/bindings";
import { PRODUCT } from "@vytrix/config";
import { useApp } from "@/stores/app";
import { LogoMark } from "@/components/ui/Logo";
import { isTauriRuntime } from "@/services/tauri";
import { useT } from "@/i18n";
import Overview from "@/pages/Overview";
import GameProfiles from "@/pages/GameProfiles";
import ColorStudio from "@/pages/ColorStudio";
import Display from "@/pages/Display";
import PresetLibrary from "@/pages/PresetLibrary";
import Crosshair from "@/pages/Crosshair";
import Effects from "@/pages/Effects";
import Optimizer from "@/pages/Optimizer";
import Performance from "@/pages/Performance";
import Hotkeys from "@/pages/Hotkeys";
import PhoneControl from "@/pages/PhoneControl";
import Themes from "@/pages/Themes";
import Settings from "@/pages/Settings";
import Misc from "@/pages/Misc";
import PotatoMode from "@/pages/PotatoMode";
import { ToastProvider } from "@/hooks/useToast";
import { BindMenuProvider } from "@/components/ui/BindMenu";
import { PhoneBridge } from "@/hooks/usePhoneBridge";
import { HotkeyBridge } from "@/hooks/useHotkeyBridge";
import { ZoomBridge } from "@/hooks/useZoomBridge";
import { FovBridge } from "@/hooks/useFovBridge";
import { SmartSwitchBridge } from "@/hooks/useSmartSwitchBridge";

const PAGES: Record<string, () => React.JSX.Element> = {
  "overview": Overview,
  "game-profiles": GameProfiles,
  "color-studio": ColorStudio,
  "display": Display,
  "preset-library": PresetLibrary,
  "crosshair": Crosshair,
  "effects": Effects,
  "optimizer": Optimizer,
  "performance": Performance,
  "hotkeys": Hotkeys,
  "phone-control": PhoneControl,
  "themes": Themes,
  "settings": Settings,
  "misc": Misc,
  "graphics-center": PotatoMode,
};

function Shell() {
  const { state, setSection } = useApp();
  const t = useT();
  const [collapsed, setCollapsed] = useState(false);
  const current = SECTION_DEFS.find((section) => section.id === state.section) ?? SECTION_DEFS[0]!;
  const Page = useMemo(() => PAGES[current.id] ?? Overview, [current.id]);
  const native = isTauriRuntime();

  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <LogoMark size={30} />
          {!collapsed ? (
            <div>
              <div className="brand-name">VYTRIX</div>
              <div className="brand-tag">{t("shell.brandTag")}</div>
            </div>
          ) : null}
        </div>

        <div className="nav-scroll">
          <div className="nav-label">{collapsed ? "â€¢â€¢â€¢" : t("shell.controlCenter")}</div>
          {SECTION_DEFS.map((section) => {
            const Icon = section.icon;
            const binds = SECTION_BINDINGS[section.id];
            return (
              <button
                key={section.id}
                className={`nav-item ${state.section === section.id ? "active" : ""}`}
                onClick={() => setSection(section.id)}
                data-bind-actions={binds?.join(",")}
                title={collapsed ? t(`section.${section.id}` as Parameters<typeof t>[0]) : undefined}
              >
                <span className="nav-index">{section.index}</span>
                <Icon size={16} style={{ flex: "none" }} />
                {!collapsed ? <span className="nav-text">{t(`section.${section.id}` as Parameters<typeof t>[0])}</span> : null}
              </button>
            );
          })}
        </div>

        <div className="sidebar-foot">
          <button className="nav-item" onClick={() => setCollapsed((value) => !value)} title="Toggle sidebar">
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed ? <span className="nav-text">{t("shell.collapse")}</span> : null}
          </button>
          <div className="nav-item" style={{ cursor: "default" }}>
            <Boxes size={16} />
            {!collapsed ? <span className="nav-note tiny" style={{ lineHeight: 1.5 }}>{t(`desc.${current.id}` as Parameters<typeof t>[0])}</span> : null}
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumb"><small>{current.index} /</small> {t(`section.${current.id}` as Parameters<typeof t>[0])}</div>
          <div className="topbar-right">
            <span className="chip"><span className={`dot ${native ? "" : "warn"}`} /> {native ? t("shell.native") : t("shell.browser")}</span>
            <span className="chip"><Radio size={11} /> v{PRODUCT.version}</span>
          </div>
        </header>

        <div className="content">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <Page />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <PhoneBridge />
      <HotkeyBridge />
      <ZoomBridge />
      <FovBridge />
      <SmartSwitchBridge />
      <BindMenuProvider />
      <Shell />
    </ToastProvider>
  );
}
