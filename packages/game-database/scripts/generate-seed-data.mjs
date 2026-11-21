import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Seed rows: name|category|launchers|process hints|confidence|release status.
// Hints are included only where a published process name is already known.
const SEED = [
  "Counter-Strike 2|shooters|steam|cs2.exe|verified|released",
  "VALORANT|shooters|riot|valorant.exe|verified|released",
  "Apex Legends|shooters|ea-app|r5apex.exe|verified|released",
  "Rainbow Six Siege|shooters|ubisoft-connect|rainbowsix.exe|verified|released",
  "Overwatch 2|shooters|battle-net|overwatch.exe|verified|released",
  "PUBG: Battlegrounds|shooters|steam|tslgame.exe|verified|released",
  "Fortnite|shooters|epic|fortniteclient-win64-shipping.exe|verified|released",
  "Call of Duty|shooters|battle-net|cod.exe,modernwarfare.exe|verified|released",
  "Call of Duty: Warzone|shooters|battle-net|mw2-warzone.exe|verified|released",
  "The Finals|shooters|steam|discovery.exe|verified|released",
  "Escape from Tarkov|shooters|manual|eft.exe|verified|released",
  "Hunt: Showdown|shooters|steam|huntshowdown.exe|manual|released",
  "Battlefield 2042|shooters|ea-app||manual|released",
  "Battlefield V|shooters|ea-app|battlefieldv.exe|manual|released",
  "Battlefield 6|shooters|ea-app||manual|unknown",
  "Team Fortress 2|shooters|steam|hl2.exe|verified|released",
  "Paladins|shooters|steam|paladins.exe|manual|released",
  "XDefiant|shooters|ubisoft-connect|xdefiant.exe|manual|discontinued",
  "Splitgate|shooters|steam|splitgate.exe|manual|discontinued",
  "Splitgate 2|shooters|steam||manual|unknown",
  "Quake Champions|shooters|steam|quakechampions.exe|manual|released",
  "Halo Infinite|shooters|xbox|haloinfinite.exe|verified|released",
  "Destiny 2|shooters|battle-net|destiny2.exe|partial|released",
  "Insurgency: Sandstorm|shooters|steam|insurgencysandstorm.exe|manual|released",
  "Ready or Not|shooters|steam|readyornot.exe|manual|released",
  "Squad|shooters|steam|squad.exe|partial|released",
  "Hell Let Loose|shooters|steam|hellletloose.exe|partial|released",
  "Arma Reforger|shooters|steam|armareforger.exe|manual|released",
  "Day of Infamy|shooters|steam|dayofinfamy.exe|manual|released",
  "Delta Force|shooters|steam||manual|unknown",

  "Rust|survival|steam|rust.exe|verified|released",
  "DayZ|survival|steam|dayz.exe|partial|released",
  "ARK: Survival Evolved|survival|steam|ark.exe|partial|released",
  "ARK: Survival Ascended|survival|steam|arksurvivalascended.exe|partial|released",
  "7 Days to Die|survival|steam|7daystodie.exe|partial|released",
  "Project Zomboid|survival|steam|projectzomboid.exe|partial|released",
  "Sons of the Forest|survival|steam|sonsoftheforest.exe|partial|released",
  "The Forest|survival|steam|theforest.exe|partial|released",
  "Valheim|survival|steam|valheim.exe|partial|released",
  "Enshrouded|survival|steam|enshrouded.exe|partial|released",
  "Palworld|survival|steam|palworld.exe|partial|released",
  "V Rising|survival|steam|vrising.exe|partial|released",
  "Conan Exiles|survival|steam|conanexiles.exe|partial|released",
  "SCUM|survival|steam|scum.exe|manual|released",
  "Unturned|survival|steam|unturned.exe|partial|released",
  "Don't Starve Together|survival|steam|dontstarve_steam.exe|partial|released",
  "Subnautica|survival|steam|subnautica.exe|partial|released",
  "Subnautica: Below Zero|survival|steam|subnauticazero.exe|manual|released",
  "Grounded|survival|steam|grounded.exe|partial|released",
  "Raft|survival|steam|raft.exe|partial|released",

  "Roblox|sandbox|manual|robloxplayerbeta.exe|partial|released",
  "ROB RUN|sandbox|steam||manual|unknown",
  "Geometry Dash|sandbox|steam|geometrydash.exe|partial|released",
  "Terraria|sandbox|steam|terraria.exe|verified|released",
  "Stardew Valley|sandbox|steam|stardewvalley.exe|verified|released",
  "Garry's Mod|sandbox|steam|gmod.exe|partial|released",
  "Lethal Company|sandbox|steam|lethal company.exe|manual|released",
  "Content Warning|sandbox|steam|contentwarning.exe|manual|released",
  "Phasmophobia|sandbox|steam|phasmophobia.exe|partial|released",
  "Among Us|sandbox|steam|among us.exe|verified|released",
  "Brawlhalla|sandbox|steam|brawlhalla.exe|partial|released",
  "Crab Game|sandbox|steam|crabgame.exe|manual|released",
  "Buckshot Roulette|sandbox|steam|buckshotroulette.exe|manual|released",
  "Human: Fall Flat|sandbox|steam|humanfallflat.exe|partial|released",
  "Peak|sandbox|steam||manual|unknown",
  "Schedule I|sandbox|steam||manual|unknown",
  "R.E.P.O.|sandbox|steam|repo.exe|manual|unknown",
  "BeamNG.drive|sandbox|steam|beamng.drive.exe|partial|released",
  "Teardown|sandbox|steam|teardown.exe|partial|released",
  "People Playground|sandbox|steam|peopleplayground.exe|manual|released",

  "Forza Horizon 5|racing|xbox|forzahorizon5.exe|verified|released",
  "Forza Motorsport|racing|xbox|forzamotorsport.exe|partial|released",
  "Assetto Corsa|racing|steam|acs.exe|partial|released",
  "Assetto Corsa Competizione|racing|steam|ac2.exe|partial|released",
  "iRacing|racing|manual|iracing.exe|manual|released",
  "F1 24|racing|ea-app|f124.exe|partial|released",
  "F1 25|racing|ea-app||manual|unknown",
  "Need for Speed Unbound|racing|ea-app|needforspeedunbound.exe|manual|released",
  "Need for Speed Heat|racing|ea-app|needforspeedheat.exe|manual|released",
  "Need for Speed Payback|racing|ea-app|needforspeedpayback.exe|manual|released",
  "The Crew Motorfest|racing|ubisoft-connect|thecrew motorfest.exe|manual|released",
  "The Crew 2|racing|ubisoft-connect|thecrew2.exe|partial|released",
  "Euro Truck Simulator 2|racing|steam|eurotrucks2.exe|partial|released",
  "American Truck Simulator|racing|steam|amtrucks.exe|partial|released",
  "SnowRunner|racing|steam|snowrunner.exe|manual|released",
  "Microsoft Flight Simulator|racing|xbox|flightsimulator.exe|partial|released",
  "Farming Simulator 25|racing|steam||manual|released",
  "CarX Drift Racing Online|racing|steam|carxdriftracingonline.exe|manual|released",
  "Wreckfest|racing|steam|wreckfest.exe|manual|released",
  "Trackmania|racing|steam|trackmania.exe|partial|released",

  "Grand Theft Auto V|rpg|steam|gta5.exe|verified|released",
  "Grand Theft Auto V Enhanced|rpg|steam|gta5_enhanced.exe|manual|released",
  "Red Dead Redemption 2|rpg|steam|rdr2.exe|verified|released",
  "Cyberpunk 2077|rpg|steam|cyberpunk2077.exe|verified|released",
  "The Witcher 3|rpg|steam|witcher3.exe|verified|released",
  "Elden Ring|rpg|steam|eldenring.exe|verified|released",
  "Dark Souls III|rpg|steam|darksoulsiii.exe|manual|released",
  "Sekiro|rpg|steam|sekiro.exe|manual|released",
  "Black Myth: Wukong|rpg|steam|blackmythwukong.exe|manual|released",
  "Hogwarts Legacy|rpg|steam|hogwarts_legacy.exe|verified|released",
  "Starfield|rpg|xbox|starfield.exe|partial|released",
  "Skyrim Special Edition|rpg|steam|skyrimse.exe|partial|released",
  "Fallout 4|rpg|steam|fallout4.exe|verified|released",
  "Kingdom Come: Deliverance II|rpg|steam||manual|released",
  "Monster Hunter Wilds|rpg|steam||manual|released",
  "Monster Hunter World|rpg|steam|monsterhunterworld.exe|partial|released",
  "Genshin Impact|rpg|manual|yuanshen.exe|manual|released",
  "Wuthering Waves|rpg|manual||manual|released",
  "Honkai: Star Rail|rpg|manual||manual|released",
  "Where Winds Meet|rpg|manual||manual|unknown",

  "League of Legends|strategy|riot|leagueoflegends.exe|verified|released",
  "Dota 2|strategy|steam|dota2.exe|verified|released",
  "SMITE 2|strategy|steam||manual|unknown",
  "Deadlock|strategy|steam||manual|released",
  "Teamfight Tactics|strategy|riot|leagueoflegends.exe|partial|released",
  "Age of Empires IV|strategy|xbox|aoe4.exe|verified|released",
  "Civilization VI|strategy|steam|civilizationvi.exe|partial|released",
  "Civilization VII|strategy|steam||manual|released",
  "Total War: Warhammer III|strategy|steam|totalwarwarhammer3.exe|manual|released",
  "Crusader Kings III|strategy|steam|ck3.exe|manual|released",
  "Hearts of Iron IV|strategy|steam|hoi4.exe|manual|released",
  "Europa Universalis IV|strategy|steam|eu4.exe|manual|released",
  "StarCraft II|strategy|battle-net|starcraft ii.exe|manual|released",
  "Warcraft III|strategy|battle-net|warcraft iii.exe|manual|released",
  "Company of Heroes 3|strategy|steam|companyofheroes3.exe|manual|released",
  "Anno 1800|strategy|steam|anno1800.exe|manual|released",
  "Cities: Skylines II|strategy|steam|cities2.exe|manual|released",
  "Factorio|strategy|steam|factorio.exe|partial|released",
  "Satisfactory|strategy|steam|factorygame.exe|partial|released",
  "Dyson Sphere Program|strategy|steam|dysonsphereprogram.exe|manual|released",

  "Resident Evil 4 Remake|horror|steam|re4.exe|partial|released",
  "Resident Evil Village|horror|steam|re8.exe|partial|released",
  "Silent Hill 2 Remake|horror|steam||manual|released",
  "Dead by Daylight|horror|steam|deadbydaylight.exe|verified|released",
  "The Outlast Trials|horror|steam|outlasttrials.exe|partial|released",
  "Outlast 2|horror|steam|outlast2.exe|partial|released",
  "Alan Wake 2|horror|epic|alanwake2.exe|partial|released",
  "Control|horror|epic|control.exe|partial|released",
  "DOOM Eternal|horror|steam|doometernal.exe|partial|released",
  "DOOM: The Dark Ages|horror|xbox||manual|unknown",
  "Metro Exodus|horror|steam|metroexodus.exe|partial|released",
  "Dying Light 2|horror|steam|dyinglight2.exe|partial|released",
  "Dead Island 2|horror|steam|deadisland2.exe|partial|released",
  "Left 4 Dead 2|horror|steam|left4dead2.exe|partial|released",
  "Back 4 Blood|horror|steam|back4blood.exe|partial|released",
  "A Plague Tale: Requiem|horror|steam|aplaguetalerequiem.exe|manual|released",
  "The Last of Us Part I|horror|steam|thelastofusparti.exe|manual|released",
  "God of War|horror|steam|godofwar.exe|partial|released",
  "God of War Ragnarök|horror|steam|godofwarragnarok.exe|manual|released",
  "Marvel's Spider-Man Remastered|horror|steam|spiderman.exe|manual|released",

  "Minecraft Java Edition|additional|manual|javaw.exe|partial|released",
  "Minecraft Bedrock Edition|additional|microsoft-store|minecraft.exe|partial|released",
  "Overwatch Classic where available|additional|battle-net||manual|unknown",
  "Sea of Thieves|additional|xbox|seathieves.exe|partial|released",
  "No Man's Sky|additional|steam|nms.exe|partial|released",
  "Deep Rock Galactic|additional|steam|deeprockgalactic.exe|partial|released",
  "Helldivers 2|additional|steam|helldivers2.exe|partial|released",
  "Warframe|additional|manual|warframe.exe|partial|released",
  "Once Human|additional|steam|oncehuman.exe|manual|released",
  "Black Desert Online|additional|manual|blackdesert64.exe|partial|released",
];

const DIRS = {
  shooters: "shooters",
  survival: "survival",
  sandbox: "sandbox",
  racing: "racing",
  rpg: "rpg",
  strategy: "strategy",
  horror: "horror",
  additional: "additional",
};

const LAUNCHER_INSTALL = {
  steam: "launcher-library",
  epic: "launcher-library",
  riot: "launcher-library",
  "battle-net": "launcher-library",
  "ubisoft-connect": "launcher-library",
  "ea-app": "launcher-library",
  xbox: "store-package",
  "microsoft-store": "store-package",
  manual: "manual-path",
};

const BASE_NOTES = [
  "Profiles declare capabilities, not claimed optimal game settings.",
  "Settings apply only when the detected monitor and GPU backend expose support.",
  "Original display state is restored on game exit, app exit, and failed apply.",
  "No game files are modified and no code is injected.",
];

const HARD_UNSUPPORTED = ["game-file-modification", "anti-cheat-bypass", "guaranteed-fps-gain"];

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function slug(value) {
  return value.toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function write(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof data === "string" ? data : `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const configurations = SEED.map((row) => {
  const [name, category, launcherText, hintText, confidence, releaseStatus] = row.split("|");
  const launchers = launcherText.split(",").filter(Boolean);
  const hints = hintText.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const primary = launchers[0];
  const installationDetection = LAUNCHER_INSTALL[primary] ?? "manual-path";
  const needsManualPath = hints.length === 0 || confidence === "manual";
  const effectiveConfidence = needsManualPath && hints.length === 0 ? "manual" : confidence;
  const automaticDetection = !needsManualPath;
  const verificationStatus = effectiveConfidence === "verified"
    ? "verified"
    : effectiveConfidence === "partial"
      ? "community"
      : "unverified";
  const verificationSource = effectiveConfidence === "verified"
    ? "VYTRIX desktop catalog audit 2026-11-21; published process name"
    : effectiveConfidence === "partial"
      ? "VYTRIX catalog seed; published process hint, not independently verified"
      : "User-provided catalog; metadata not independently verified";

  const methods = [...new Set([
    ...(automaticDetection ? ["executable", "process"] : []),
    installationDetection,
  ])];
  const rules = [
    ...(automaticDetection ? hints.map((value) => ({ type: "executable", value })) : []),
    ...(automaticDetection ? hints.map((value) => ({ type: "process", value })) : []),
    { type: installationDetection, value: primary },
  ];

  const capabilities = {
    automaticDetection,
    colorProfiles: true,
    displayProfiles: true,
    crosshair: category === "shooters" || category === "strategy" ? "restricted" : "unknown",
    overlay: "unknown",
    performanceMonitoring: true,
    restoration: true,
  };

  const supportedFeatures = [];
  const unsupportedFeatures = [...HARD_UNSUPPORTED];
  if (automaticDetection) supportedFeatures.push("detection"); else unsupportedFeatures.push("detection");
  supportedFeatures.push("color-profiles", "display-profiles", "monitoring", "restoration");
  if (capabilities.crosshair === "supported") supportedFeatures.push("crosshair"); else unsupportedFeatures.push("crosshair");
  if (capabilities.overlay === "supported") supportedFeatures.push("overlay"); else unsupportedFeatures.push("overlay");

  const compatibilityNotes = [...BASE_NOTES];
  if (needsManualPath) compatibilityNotes.push("Executable path must be supplied manually.");
  if (releaseStatus === "unknown") compatibilityNotes.push("Release availability and launcher state were not verified.");
  if (capabilities.overlay !== "supported" || capabilities.crosshair !== "supported") {
    compatibilityNotes.push("External overlay use may be restricted by the title or its anti-cheat; VYTRIX uses a transparent native window only where permitted.");
  }

  return {
    id: slug(name),
    name,
    category,
    launchers,
    executableNames: hints,
    processNames: hints,
    detection: { methods, requiresManualPath: needsManualPath, confidence: effectiveConfidence, rules },
    installationDetection,
    icon: "assets/branding/vytrix-icon.svg",
    defaults: {
      colorProfileId: "vytrix-neutral-v1",
      displayProfileId: "hardware-detect-v1",
      resolutionProfileId: "detect-monitor-v1",
      refreshRateProfileId: "detect-supported-maximum-v1",
      restorationMode: "automatic-restore-v1",
      crosshairEnabled: false,
      overlayEnabled: false,
      monitoringEnabled: true,
    },
    capabilities,
    compatibilityNotes,
    supportedFeatures,
    unsupportedFeatures,
    configurationSource: "vytrix-catalog-seed-v1",
    releaseStatus,
    verification: { status: verificationStatus, source: verificationSource, lastVerifiedAt: null },
    schemaVersion: 1,
    profileSchemaVersion: 1,
  };
});

const ids = new Set();
for (const config of configurations) {
  if (ids.has(config.id)) throw new Error(`duplicate generated id ${config.id}`);
  ids.add(config.id);
  const target = join(root, "data", DIRS[config.category], `${config.id}.json`);
  write(target, config);
}

write(join(root, "data", "index.json"), configurations);

const generatedIndex = [
  'import type { GameConfiguration } from "../schema.js";',
  "",
  "export const gameConfigurations: readonly GameConfiguration[] = ",
  `${JSON.stringify(configurations, null, 2)};`,
  "",
].join("\n");
write(join(root, "src", "generated", "game-index.ts"), generatedIndex);

console.log(`generated ${configurations.length} game configurations`);
