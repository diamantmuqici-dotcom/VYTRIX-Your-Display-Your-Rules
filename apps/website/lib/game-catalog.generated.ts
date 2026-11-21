// GENERATED FILE — do not edit by hand.
// Source: packages/game-database/src/generated/game-index.ts
// Regenerate with: node scripts/generate-website-catalog.cjs
export interface GameCatalogEntry {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  launchers: string[];
  executableNames: string[];
  detectionConfidence: "verified" | "partial" | "manual";
  detectionMethods: string[];
  verificationStatus: "verified" | "community" | "unverified";
  verificationSource: string;
  releaseStatus: string;
  capabilities: {
    colorProfiles: boolean;
    displayProfiles: boolean;
    performanceMonitoring: boolean;
    restoration: boolean;
    crosshair: string;
    overlay: string;
  };
  supportedFeatures: string[];
  unsupportedFeatures: string[];
  blurb: string;
}

export const gameCatalog: GameCatalogEntry[] = [
  {
    "id": "7-days-to-die",
    "name": "7 Days to Die",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "7daystodie.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises 7 Days to Die by steam and the 7daystodie.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "a-plague-tale-requiem",
    "name": "A Plague Tale: Requiem",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "aplaguetalerequiem.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises A Plague Tale: Requiem by steam and the aplaguetalerequiem.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "age-of-empires-iv",
    "name": "Age of Empires IV",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "xbox"
    ],
    "executableNames": [
      "aoe4.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "store-package"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Age of Empires IV by xbox and the aoe4.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "alan-wake-2",
    "name": "Alan Wake 2",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "epic"
    ],
    "executableNames": [
      "alanwake2.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Alan Wake 2 by epic and the alanwake2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "american-truck-simulator",
    "name": "American Truck Simulator",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "amtrucks.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises American Truck Simulator by steam and the amtrucks.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "among-us",
    "name": "Among Us",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "among us.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Among Us by steam and the among us.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "anno-1800",
    "name": "Anno 1800",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "anno1800.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Anno 1800 by steam and the anno1800.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "apex-legends",
    "name": "Apex Legends",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "ea-app"
    ],
    "executableNames": [
      "r5apex.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Apex Legends by ea-app and the r5apex.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "ark-survival-ascended",
    "name": "ARK: Survival Ascended",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "arksurvivalascended.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises ARK: Survival Ascended by steam and the arksurvivalascended.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "ark-survival-evolved",
    "name": "ARK: Survival Evolved",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "ark.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises ARK: Survival Evolved by steam and the ark.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "arma-reforger",
    "name": "Arma Reforger",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "armareforger.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Arma Reforger by steam and the armareforger.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "assetto-corsa",
    "name": "Assetto Corsa",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "acs.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Assetto Corsa by steam and the acs.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "assetto-corsa-competizione",
    "name": "Assetto Corsa Competizione",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "ac2.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Assetto Corsa Competizione by steam and the ac2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "back-4-blood",
    "name": "Back 4 Blood",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "back4blood.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Back 4 Blood by steam and the back4blood.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "battlefield-2042",
    "name": "Battlefield 2042",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "ea-app"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Battlefield 2042 by ea-app. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "battlefield-6",
    "name": "Battlefield 6",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "ea-app"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "unknown",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Battlefield 6 by ea-app. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "battlefield-v",
    "name": "Battlefield V",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "ea-app"
    ],
    "executableNames": [
      "battlefieldv.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Battlefield V by ea-app and the battlefieldv.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "beamng-drive",
    "name": "BeamNG.drive",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "beamng.drive.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises BeamNG.drive by steam and the beamng.drive.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "black-desert-online",
    "name": "Black Desert Online",
    "category": "additional",
    "categoryLabel": "More popular titles",
    "launchers": [
      "manual"
    ],
    "executableNames": [
      "blackdesert64.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "manual-path"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Black Desert Online by manual and the blackdesert64.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "black-myth-wukong",
    "name": "Black Myth: Wukong",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "blackmythwukong.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Black Myth: Wukong by steam and the blackmythwukong.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "brawlhalla",
    "name": "Brawlhalla",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "brawlhalla.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Brawlhalla by steam and the brawlhalla.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "buckshot-roulette",
    "name": "Buckshot Roulette",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "buckshotroulette.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Buckshot Roulette by steam and the buckshotroulette.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "call-of-duty",
    "name": "Call of Duty",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "battle-net"
    ],
    "executableNames": [
      "cod.exe",
      "modernwarfare.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Call of Duty by battle-net and the cod.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "call-of-duty-warzone",
    "name": "Call of Duty: Warzone",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "battle-net"
    ],
    "executableNames": [
      "mw2-warzone.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Call of Duty: Warzone by battle-net and the mw2-warzone.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "carx-drift-racing-online",
    "name": "CarX Drift Racing Online",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "carxdriftracingonline.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises CarX Drift Racing Online by steam and the carxdriftracingonline.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "cities-skylines-ii",
    "name": "Cities: Skylines II",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "cities2.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Cities: Skylines II by steam and the cities2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "civilization-vi",
    "name": "Civilization VI",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "civilizationvi.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Civilization VI by steam and the civilizationvi.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "civilization-vii",
    "name": "Civilization VII",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Civilization VII by steam. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "company-of-heroes-3",
    "name": "Company of Heroes 3",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "companyofheroes3.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Company of Heroes 3 by steam and the companyofheroes3.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "conan-exiles",
    "name": "Conan Exiles",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "conanexiles.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Conan Exiles by steam and the conanexiles.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "content-warning",
    "name": "Content Warning",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "contentwarning.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Content Warning by steam and the contentwarning.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "control",
    "name": "Control",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "epic"
    ],
    "executableNames": [
      "control.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Control by epic and the control.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "counter-strike-2",
    "name": "Counter-Strike 2",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "cs2.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Counter-Strike 2 by steam and the cs2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "crab-game",
    "name": "Crab Game",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "crabgame.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Crab Game by steam and the crabgame.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "crusader-kings-iii",
    "name": "Crusader Kings III",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "ck3.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Crusader Kings III by steam and the ck3.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "cyberpunk-2077",
    "name": "Cyberpunk 2077",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "cyberpunk2077.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Cyberpunk 2077 by steam and the cyberpunk2077.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "dark-souls-iii",
    "name": "Dark Souls III",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "darksoulsiii.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Dark Souls III by steam and the darksoulsiii.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "day-of-infamy",
    "name": "Day of Infamy",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "dayofinfamy.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Day of Infamy by steam and the dayofinfamy.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "dayz",
    "name": "DayZ",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "dayz.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises DayZ by steam and the dayz.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "dead-by-daylight",
    "name": "Dead by Daylight",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "deadbydaylight.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Dead by Daylight by steam and the deadbydaylight.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "dead-island-2",
    "name": "Dead Island 2",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "deadisland2.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Dead Island 2 by steam and the deadisland2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "deadlock",
    "name": "Deadlock",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Deadlock by steam. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "deep-rock-galactic",
    "name": "Deep Rock Galactic",
    "category": "additional",
    "categoryLabel": "More popular titles",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "deeprockgalactic.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Deep Rock Galactic by steam and the deeprockgalactic.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "delta-force",
    "name": "Delta Force",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "unknown",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Delta Force by steam. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "destiny-2",
    "name": "Destiny 2",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "battle-net"
    ],
    "executableNames": [
      "destiny2.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Destiny 2 by battle-net and the destiny2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "don-t-starve-together",
    "name": "Don't Starve Together",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "dontstarve_steam.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Don't Starve Together by steam and the dontstarve_steam.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "doom-eternal",
    "name": "DOOM Eternal",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "doometernal.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises DOOM Eternal by steam and the doometernal.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "doom-the-dark-ages",
    "name": "DOOM: The Dark Ages",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "xbox"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "store-package"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "unknown",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises DOOM: The Dark Ages by xbox. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "dota-2",
    "name": "Dota 2",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "dota2.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Dota 2 by steam and the dota2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "dying-light-2",
    "name": "Dying Light 2",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "dyinglight2.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Dying Light 2 by steam and the dyinglight2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "dyson-sphere-program",
    "name": "Dyson Sphere Program",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "dysonsphereprogram.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Dyson Sphere Program by steam and the dysonsphereprogram.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "elden-ring",
    "name": "Elden Ring",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "eldenring.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Elden Ring by steam and the eldenring.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "enshrouded",
    "name": "Enshrouded",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "enshrouded.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Enshrouded by steam and the enshrouded.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "escape-from-tarkov",
    "name": "Escape from Tarkov",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "manual"
    ],
    "executableNames": [
      "eft.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "manual-path"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Escape from Tarkov by manual and the eft.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "euro-truck-simulator-2",
    "name": "Euro Truck Simulator 2",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "eurotrucks2.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Euro Truck Simulator 2 by steam and the eurotrucks2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "europa-universalis-iv",
    "name": "Europa Universalis IV",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "eu4.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Europa Universalis IV by steam and the eu4.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "f1-24",
    "name": "F1 24",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "ea-app"
    ],
    "executableNames": [
      "f124.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises F1 24 by ea-app and the f124.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "f1-25",
    "name": "F1 25",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "ea-app"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "unknown",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises F1 25 by ea-app. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "factorio",
    "name": "Factorio",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "factorio.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Factorio by steam and the factorio.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "fallout-4",
    "name": "Fallout 4",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "fallout4.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Fallout 4 by steam and the fallout4.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "farming-simulator-25",
    "name": "Farming Simulator 25",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "steam"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Farming Simulator 25 by steam. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "fortnite",
    "name": "Fortnite",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "epic"
    ],
    "executableNames": [
      "fortniteclient-win64-shipping.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Fortnite by epic and the fortniteclient-win64-shipping.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "forza-horizon-5",
    "name": "Forza Horizon 5",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "xbox"
    ],
    "executableNames": [
      "forzahorizon5.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "store-package"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Forza Horizon 5 by xbox and the forzahorizon5.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "forza-motorsport",
    "name": "Forza Motorsport",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "xbox"
    ],
    "executableNames": [
      "forzamotorsport.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "store-package"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Forza Motorsport by xbox and the forzamotorsport.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "garry-s-mod",
    "name": "Garry's Mod",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "gmod.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Garry's Mod by steam and the gmod.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "genshin-impact",
    "name": "Genshin Impact",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "manual"
    ],
    "executableNames": [
      "yuanshen.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "manual-path"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Genshin Impact by manual and the yuanshen.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "geometry-dash",
    "name": "Geometry Dash",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "geometrydash.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Geometry Dash by steam and the geometrydash.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "god-of-war",
    "name": "God of War",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "godofwar.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises God of War by steam and the godofwar.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "god-of-war-ragnaro-k",
    "name": "God of War Ragnarök",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "godofwarragnarok.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises God of War Ragnarök by steam and the godofwarragnarok.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "grand-theft-auto-v",
    "name": "Grand Theft Auto V",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "gta5.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Grand Theft Auto V by steam and the gta5.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "grand-theft-auto-v-enhanced",
    "name": "Grand Theft Auto V Enhanced",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "gta5_enhanced.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Grand Theft Auto V Enhanced by steam and the gta5_enhanced.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "grounded",
    "name": "Grounded",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "grounded.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Grounded by steam and the grounded.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "halo-infinite",
    "name": "Halo Infinite",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "xbox"
    ],
    "executableNames": [
      "haloinfinite.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "store-package"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Halo Infinite by xbox and the haloinfinite.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "hearts-of-iron-iv",
    "name": "Hearts of Iron IV",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "hoi4.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Hearts of Iron IV by steam and the hoi4.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "hell-let-loose",
    "name": "Hell Let Loose",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "hellletloose.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Hell Let Loose by steam and the hellletloose.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "helldivers-2",
    "name": "Helldivers 2",
    "category": "additional",
    "categoryLabel": "More popular titles",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "helldivers2.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Helldivers 2 by steam and the helldivers2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "hogwarts-legacy",
    "name": "Hogwarts Legacy",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "hogwarts_legacy.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Hogwarts Legacy by steam and the hogwarts_legacy.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "honkai-star-rail",
    "name": "Honkai: Star Rail",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "manual"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "manual-path"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Honkai: Star Rail by manual. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "human-fall-flat",
    "name": "Human: Fall Flat",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "humanfallflat.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Human: Fall Flat by steam and the humanfallflat.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "hunt-showdown",
    "name": "Hunt: Showdown",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "huntshowdown.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Hunt: Showdown by steam and the huntshowdown.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "insurgency-sandstorm",
    "name": "Insurgency: Sandstorm",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "insurgencysandstorm.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Insurgency: Sandstorm by steam and the insurgencysandstorm.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "iracing",
    "name": "iRacing",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "manual"
    ],
    "executableNames": [
      "iracing.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "manual-path"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises iRacing by manual and the iracing.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "kingdom-come-deliverance-ii",
    "name": "Kingdom Come: Deliverance II",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Kingdom Come: Deliverance II by steam. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "league-of-legends",
    "name": "League of Legends",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "riot"
    ],
    "executableNames": [
      "leagueoflegends.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises League of Legends by riot and the leagueoflegends.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "left-4-dead-2",
    "name": "Left 4 Dead 2",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "left4dead2.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Left 4 Dead 2 by steam and the left4dead2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "lethal-company",
    "name": "Lethal Company",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "lethal company.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Lethal Company by steam and the lethal company.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "marvel-s-spider-man-remastered",
    "name": "Marvel's Spider-Man Remastered",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "spiderman.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Marvel's Spider-Man Remastered by steam and the spiderman.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "metro-exodus",
    "name": "Metro Exodus",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "metroexodus.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Metro Exodus by steam and the metroexodus.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "microsoft-flight-simulator",
    "name": "Microsoft Flight Simulator",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "xbox"
    ],
    "executableNames": [
      "flightsimulator.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "store-package"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Microsoft Flight Simulator by xbox and the flightsimulator.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "minecraft-bedrock-edition",
    "name": "Minecraft Bedrock Edition",
    "category": "additional",
    "categoryLabel": "More popular titles",
    "launchers": [
      "microsoft-store"
    ],
    "executableNames": [
      "minecraft.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "store-package"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Minecraft Bedrock Edition by microsoft-store and the minecraft.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "minecraft-java-edition",
    "name": "Minecraft Java Edition",
    "category": "additional",
    "categoryLabel": "More popular titles",
    "launchers": [
      "manual"
    ],
    "executableNames": [
      "javaw.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "manual-path"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Minecraft Java Edition by manual and the javaw.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "monster-hunter-wilds",
    "name": "Monster Hunter Wilds",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Monster Hunter Wilds by steam. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "monster-hunter-world",
    "name": "Monster Hunter World",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "monsterhunterworld.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Monster Hunter World by steam and the monsterhunterworld.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "need-for-speed-heat",
    "name": "Need for Speed Heat",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "ea-app"
    ],
    "executableNames": [
      "needforspeedheat.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Need for Speed Heat by ea-app and the needforspeedheat.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "need-for-speed-payback",
    "name": "Need for Speed Payback",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "ea-app"
    ],
    "executableNames": [
      "needforspeedpayback.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Need for Speed Payback by ea-app and the needforspeedpayback.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "need-for-speed-unbound",
    "name": "Need for Speed Unbound",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "ea-app"
    ],
    "executableNames": [
      "needforspeedunbound.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Need for Speed Unbound by ea-app and the needforspeedunbound.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "no-man-s-sky",
    "name": "No Man's Sky",
    "category": "additional",
    "categoryLabel": "More popular titles",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "nms.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises No Man's Sky by steam and the nms.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "once-human",
    "name": "Once Human",
    "category": "additional",
    "categoryLabel": "More popular titles",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "oncehuman.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Once Human by steam and the oncehuman.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "outlast-2",
    "name": "Outlast 2",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "outlast2.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Outlast 2 by steam and the outlast2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "overwatch-2",
    "name": "Overwatch 2",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "battle-net"
    ],
    "executableNames": [
      "overwatch.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Overwatch 2 by battle-net and the overwatch.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "overwatch-classic-where-available",
    "name": "Overwatch Classic where available",
    "category": "additional",
    "categoryLabel": "More popular titles",
    "launchers": [
      "battle-net"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "unknown",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Overwatch Classic where available by battle-net. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "paladins",
    "name": "Paladins",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "paladins.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Paladins by steam and the paladins.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "palworld",
    "name": "Palworld",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "palworld.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Palworld by steam and the palworld.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "peak",
    "name": "Peak",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "unknown",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Peak by steam. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "people-playground",
    "name": "People Playground",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "peopleplayground.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises People Playground by steam and the peopleplayground.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "phasmophobia",
    "name": "Phasmophobia",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "phasmophobia.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Phasmophobia by steam and the phasmophobia.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "project-zomboid",
    "name": "Project Zomboid",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "projectzomboid.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Project Zomboid by steam and the projectzomboid.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "pubg-battlegrounds",
    "name": "PUBG: Battlegrounds",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "tslgame.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises PUBG: Battlegrounds by steam and the tslgame.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "quake-champions",
    "name": "Quake Champions",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "quakechampions.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Quake Champions by steam and the quakechampions.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "r-e-p-o",
    "name": "R.E.P.O.",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "repo.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "unknown",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises R.E.P.O. by steam and the repo.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "raft",
    "name": "Raft",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "raft.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Raft by steam and the raft.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "rainbow-six-siege",
    "name": "Rainbow Six Siege",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "ubisoft-connect"
    ],
    "executableNames": [
      "rainbowsix.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Rainbow Six Siege by ubisoft-connect and the rainbowsix.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "ready-or-not",
    "name": "Ready or Not",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "readyornot.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Ready or Not by steam and the readyornot.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "red-dead-redemption-2",
    "name": "Red Dead Redemption 2",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "rdr2.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Red Dead Redemption 2 by steam and the rdr2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "resident-evil-4-remake",
    "name": "Resident Evil 4 Remake",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "re4.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Resident Evil 4 Remake by steam and the re4.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "resident-evil-village",
    "name": "Resident Evil Village",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "re8.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Resident Evil Village by steam and the re8.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "rob-run",
    "name": "ROB RUN",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "Operator-confirmed Steam title; executable resolved from local Steam manifests",
    "releaseStatus": "unknown",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises ROB RUN by steam. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "roblox",
    "name": "Roblox",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "manual"
    ],
    "executableNames": [
      "robloxplayerbeta.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "manual-path"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Roblox by manual and the robloxplayerbeta.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "rust",
    "name": "Rust",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "rust.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Rust by steam and the rust.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "satisfactory",
    "name": "Satisfactory",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "factorygame.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Satisfactory by steam and the factorygame.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "schedule-i",
    "name": "Schedule I",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "unknown",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Schedule I by steam. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "scum",
    "name": "SCUM",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "scum.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises SCUM by steam and the scum.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "sea-of-thieves",
    "name": "Sea of Thieves",
    "category": "additional",
    "categoryLabel": "More popular titles",
    "launchers": [
      "xbox"
    ],
    "executableNames": [
      "seathieves.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "store-package"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Sea of Thieves by xbox and the seathieves.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "sekiro",
    "name": "Sekiro",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "sekiro.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Sekiro by steam and the sekiro.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "silent-hill-2-remake",
    "name": "Silent Hill 2 Remake",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Silent Hill 2 Remake by steam. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "skyrim-special-edition",
    "name": "Skyrim Special Edition",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "skyrimse.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Skyrim Special Edition by steam and the skyrimse.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "smite-2",
    "name": "SMITE 2",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "unknown",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises SMITE 2 by steam. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "snaptap",
    "name": "SnapTap",
    "category": "misc",
    "categoryLabel": "Utilities & input tools",
    "launchers": [
      "manual"
    ],
    "executableNames": [
      "snapkey_v1.7.0.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "manual-path"
    ],
    "verificationStatus": "community",
    "verificationSource": "Vendored SnapKey v1.8.0 source and documented binary name; upstream base cafali/SnapKey (MIT)",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": false,
      "displayProfiles": false,
      "performanceMonitoring": false,
      "restoration": false,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection"
    ],
    "unsupportedFeatures": [
      "color-profiles",
      "display-profiles",
      "crosshair",
      "overlay",
      "monitoring",
      "restoration",
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain"
    ],
    "blurb": "VYTRIX recognises SnapTap by manual and the snapkey_v1.7.0.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "snowrunner",
    "name": "SnowRunner",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "snowrunner.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises SnowRunner by steam and the snowrunner.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "sons-of-the-forest",
    "name": "Sons of the Forest",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "sonsoftheforest.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Sons of the Forest by steam and the sonsoftheforest.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "splitgate",
    "name": "Splitgate",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "splitgate.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "discontinued",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Splitgate by steam and the splitgate.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "splitgate-2",
    "name": "Splitgate 2",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "unknown",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Splitgate 2 by steam. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "squad",
    "name": "Squad",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "squad.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Squad by steam and the squad.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "starcraft-ii",
    "name": "StarCraft II",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "battle-net"
    ],
    "executableNames": [
      "starcraft ii.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises StarCraft II by battle-net and the starcraft ii.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "stardew-valley",
    "name": "Stardew Valley",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "stardewvalley.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Stardew Valley by steam and the stardewvalley.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "starfield",
    "name": "Starfield",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "xbox"
    ],
    "executableNames": [
      "starfield.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "store-package"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Starfield by xbox and the starfield.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "subnautica",
    "name": "Subnautica",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "subnautica.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Subnautica by steam and the subnautica.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "subnautica-below-zero",
    "name": "Subnautica: Below Zero",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "subnauticazero.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Subnautica: Below Zero by steam and the subnauticazero.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "team-fortress-2",
    "name": "Team Fortress 2",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "hl2.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Team Fortress 2 by steam and the hl2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "teamfight-tactics",
    "name": "Teamfight Tactics",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "riot"
    ],
    "executableNames": [
      "leagueoflegends.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Teamfight Tactics by riot and the leagueoflegends.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "teardown",
    "name": "Teardown",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "teardown.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Teardown by steam and the teardown.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "terraria",
    "name": "Terraria",
    "category": "sandbox",
    "categoryLabel": "Roblox & indie",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "terraria.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Terraria by steam and the terraria.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "the-crew-2",
    "name": "The Crew 2",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "ubisoft-connect"
    ],
    "executableNames": [
      "thecrew2.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises The Crew 2 by ubisoft-connect and the thecrew2.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "the-crew-motorfest",
    "name": "The Crew Motorfest",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "ubisoft-connect"
    ],
    "executableNames": [
      "thecrew motorfest.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises The Crew Motorfest by ubisoft-connect and the thecrew motorfest.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "the-finals",
    "name": "The Finals",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "discovery.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises The Finals by steam and the discovery.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "the-forest",
    "name": "The Forest",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "theforest.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises The Forest by steam and the theforest.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "the-last-of-us-part-i",
    "name": "The Last of Us Part I",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "thelastofusparti.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises The Last of Us Part I by steam and the thelastofusparti.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "the-outlast-trials",
    "name": "The Outlast Trials",
    "category": "horror",
    "categoryLabel": "Horror & adventure",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "outlasttrials.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises The Outlast Trials by steam and the outlasttrials.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "the-witcher-3",
    "name": "The Witcher 3",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "witcher3.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises The Witcher 3 by steam and the witcher3.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "total-war-warhammer-iii",
    "name": "Total War: Warhammer III",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "totalwarwarhammer3.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Total War: Warhammer III by steam and the totalwarwarhammer3.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "trackmania",
    "name": "Trackmania",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "trackmania.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Trackmania by steam and the trackmania.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "unturned",
    "name": "Unturned",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "unturned.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Unturned by steam and the unturned.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "v-rising",
    "name": "V Rising",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "vrising.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises V Rising by steam and the vrising.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "valheim",
    "name": "Valheim",
    "category": "survival",
    "categoryLabel": "Survival & sandbox",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "valheim.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Valheim by steam and the valheim.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "valorant",
    "name": "VALORANT",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "riot"
    ],
    "executableNames": [
      "valorant.exe"
    ],
    "detectionConfidence": "verified",
    "detectionMethods": [
      "executable",
      "process",
      "launcher-library"
    ],
    "verificationStatus": "verified",
    "verificationSource": "VYTRIX desktop catalog audit 2026-11-21; published process name",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises VALORANT by riot and the valorant.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "warcraft-iii",
    "name": "Warcraft III",
    "category": "strategy",
    "categoryLabel": "MOBA & strategy",
    "launchers": [
      "battle-net"
    ],
    "executableNames": [
      "warcraft iii.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Warcraft III by battle-net and the warcraft iii.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "warframe",
    "name": "Warframe",
    "category": "additional",
    "categoryLabel": "More popular titles",
    "launchers": [
      "manual"
    ],
    "executableNames": [
      "warframe.exe"
    ],
    "detectionConfidence": "partial",
    "detectionMethods": [
      "executable",
      "process",
      "manual-path"
    ],
    "verificationStatus": "community",
    "verificationSource": "VYTRIX catalog seed; published process hint, not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Warframe by manual and the warframe.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "where-winds-meet",
    "name": "Where Winds Meet",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "manual"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "manual-path"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "unknown",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Where Winds Meet by manual. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "wreckfest",
    "name": "Wreckfest",
    "category": "racing",
    "categoryLabel": "Racing & simulation",
    "launchers": [
      "steam"
    ],
    "executableNames": [
      "wreckfest.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Wreckfest by steam and the wreckfest.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "wuthering-waves",
    "name": "Wuthering Waves",
    "category": "rpg",
    "categoryLabel": "RPG & open world",
    "launchers": [
      "manual"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "manual-path"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises Wuthering Waves by manual. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "xdefiant",
    "name": "XDefiant",
    "category": "shooters",
    "categoryLabel": "Competitive shooters",
    "launchers": [
      "ubisoft-connect"
    ],
    "executableNames": [
      "xdefiant.exe"
    ],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "launcher-library"
    ],
    "verificationStatus": "unverified",
    "verificationSource": "User-provided catalog; metadata not independently verified",
    "releaseStatus": "discontinued",
    "capabilities": {
      "colorProfiles": true,
      "displayProfiles": true,
      "performanceMonitoring": true,
      "restoration": true,
      "crosshair": "restricted",
      "overlay": "unknown"
    },
    "supportedFeatures": [
      "color-profiles",
      "display-profiles",
      "monitoring",
      "restoration"
    ],
    "unsupportedFeatures": [
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain",
      "detection",
      "crosshair",
      "overlay"
    ],
    "blurb": "VYTRIX recognises XDefiant by ubisoft-connect and the xdefiant.exe executable. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  },
  {
    "id": "zoom",
    "name": "Zoom",
    "category": "misc",
    "categoryLabel": "Utilities & input tools",
    "launchers": [
      "manual"
    ],
    "executableNames": [],
    "detectionConfidence": "manual",
    "detectionMethods": [
      "manual-path"
    ],
    "verificationStatus": "verified",
    "verificationSource": "Microsoft Magnification API documentation and VYTRIX native zoom module",
    "releaseStatus": "released",
    "capabilities": {
      "colorProfiles": false,
      "displayProfiles": false,
      "performanceMonitoring": false,
      "restoration": false,
      "crosshair": "unknown",
      "overlay": "unknown"
    },
    "supportedFeatures": [],
    "unsupportedFeatures": [
      "detection",
      "color-profiles",
      "display-profiles",
      "crosshair",
      "overlay",
      "monitoring",
      "restoration",
      "game-file-modification",
      "anti-cheat-bypass",
      "guaranteed-fps-gain"
    ],
    "blurb": "VYTRIX recognises Zoom by manual. When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit."
  }
];

export const gameCatalogStats = {
  total: 162,
  categories: 9,
  verified: 30,
  community: 67,
  executableHints: 141,
  byCategory: {"survival":20,"horror":20,"strategy":20,"racing":20,"sandbox":20,"shooters":30,"additional":10,"rpg":20,"misc":2},
} as const;
