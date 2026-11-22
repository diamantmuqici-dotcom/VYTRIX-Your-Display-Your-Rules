import { useState } from "react";
import { PageHead } from "@/components/ui/Panel";
import { useT } from "@/i18n";
import ZoomPanel from "./ZoomPanel";
import FovPanel from "./FovPanel";
import SnapTapPanel from "./SnapTapPanel";

type MiscTab = "zoom" | "fov" | "snaptap";

/** Single Misc home for the bundled utilities, matching the misc game category. */
export default function Misc() {
  const [tab, setTab] = useState<MiscTab>("zoom");
  const t = useT();
  return (
    <div className="page">
      <PageHead title={t("section.misc")} description={t("desc.misc")} />
      <div className="row" style={{ gap: 8, marginBottom: 16 }}>
        <button className={`btn ${tab === "zoom" ? "primary" : ""}`} onClick={() => setTab("zoom")}>{t("misc.tab.zoom")}</button>
        <button className={`btn ${tab === "fov" ? "primary" : ""}`} onClick={() => setTab("fov")}>{t("misc.tab.fov")}</button>
        <button className={`btn ${tab === "snaptap" ? "primary" : ""}`} onClick={() => setTab("snaptap")}>{t("misc.tab.snaptap")}</button>
      </div>
      {tab === "zoom" ? <ZoomPanel /> : tab === "fov" ? <FovPanel /> : <SnapTapPanel />}
    </div>
  );
}
