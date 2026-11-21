import type { CrosshairAdvanced, CrosshairDesign } from "@vytrix/shared-types";

export interface StudioProps {
  design: CrosshairDesign;
  setDesign: (design: CrosshairDesign) => void;
  patchAdvanced: (patch: Partial<CrosshairAdvanced>) => void;
  commit: (design?: CrosshairDesign) => void;
  selectDesign: (design: CrosshairDesign) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
}
