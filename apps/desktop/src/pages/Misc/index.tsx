import { useState } from "react";
import { PageHead } from "@/components/ui/Panel";
import { useT } from "@/i18n";
import ZoomPanel from "./ZoomPanel";
import SnapTapPanel from "./SnapTapPanel";

type MiscTab = "zoom" | "snaptap";

/** Single Misc home for the two bundled utilities, matching the misc game category. */
export default function Misc() {
  const [tab, setTab] = useState<MiscTab>("zoom");
  const t = useT();
  return (
    <div className="page">
      <PageHead title={t("section.misc")} description={t("desc.misc")} />
      <div className="row" style={{ gap: 8, marginBottom: 16 }}>
        <button className={`btn ${tab === "zoom" ? "primary" : ""}`} onClick={() => setTab("zoom")}>{t("misc.tab.zoom")}</button>
        <button className={`btn ${tab === "snaptap" ? "primary" : ""}`} onClick={() => setTab("snaptap")}>{t("misc.tab.snaptap")}</button>
      </div>
      {tab === "zoom" ? <ZoomPanel /> : <SnapTapPanel />}
    </div>
  );
}
