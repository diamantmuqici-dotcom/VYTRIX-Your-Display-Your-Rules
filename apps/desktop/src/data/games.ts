import { GAME_CONFIGURATIONS } from "@vytrix/game-database";
import type { GameEntry, Launcher } from "@vytrix/shared-types";

// Executable hints are published process names. Entries without a verified
// hint remain manually configurable and are labelled as such in the UI.
type Verified = [string, Launcher, string[]];

const VERIFIED: Verified[] = [
  ["Counter-Strike 2", "steam", ["cs2.exe"]],
  ["Rust", "steam", ["rust.exe"]],
  ["Apex Legends", "ea-app", ["r5apex.exe"]],
  ["VALORANT", "riot", ["valorant.exe"]],
  ["Fortnite", "epic", ["fortniteclient-win64-shipping.exe"]],
  ["Rainbow Six Siege", "ubisoft-connect", ["rainbowsix.exe"]],
  ["Overwatch 2", "battle-net", ["overwatch.exe"]],
  ["Minecraft", "microsoft-store", ["minecraft.exe"]],
  ["GTA V", "steam", ["gta5.exe"]],
  ["PUBG: Battlegrounds", "steam", ["tslgame.exe"]],
  ["Call of Duty", "battle-net", ["cod.exe", "modernwarfare.exe"]],
  ["Warzone", "battle-net", ["mw2-warzone.exe"]],
  ["Rocket League", "epic", ["rocketleague.exe"]],
  ["The Finals", "steam", ["discovery.exe"]],
  ["Escape from Tarkov", "manual", ["逃离塔科夫.exe", "eft.exe"]],
  ["League of Legends", "riot", ["leagueoflegends.exe"]],
  ["Dota 2", "steam", ["dota2.exe"]],
  ["Team Fortress 2", "steam", ["hl2.exe"]],
  ["DoTA Underlords", "steam", ["underlords.exe"]],
  ["Dead by Daylight", "steam", ["deadbydaylight.exe"]],
  ["Cyberpunk 2077", "steam", ["cyberpunk2077.exe"]],
  ["Elden Ring", "steam", ["eldenring.exe"]],
  ["Baldur's Gate 3", "steam", ["bg3.exe"]],
  ["Hogwarts Legacy", "steam", ["hogwarts_legacy.exe"]],
  ["Red Dead Redemption 2", "steam", ["rdr2.exe"]],
  ["The Witcher 3", "steam", ["witcher3.exe"]],
  ["Fallout 4", "steam", ["fallout4.exe"]],
  ["Skyrim", "steam", ["tesv.exe"]],
  ["Mass Effect Legendary Edition", "steam", ["me1.exe", "me2.exe", "me3.exe"]],
  ["Halo Infinite", "xbox", ["haloinfinite.exe"]],
  ["Forza Horizon 5", "xbox", ["forzahorizon5.exe"]],
  ["Sea of Thieves", "xbox", ["seathieves.exe"]],
  ["Gears 5", "xbox", ["gears5.exe"]],
  ["Age of Empires IV", "xbox", ["aoe4.exe"]],
  ["Hades", "steam", ["hades.exe"]],
  ["Hollow Knight", "steam", ["hollow_knight.exe"]],
  ["Stardew Valley", "steam", ["stardewvalley.exe"]],
  ["Terraria", "steam", ["terraria.exe"]],
  ["Among Us", "steam", ["among us.exe"]],
  ["Apex Mobile Emulator", "manual", []],
];

const CATALOG = `
ROB RUN|steam
GTA VI|steam
Half-Life 2|steam
Portal 2|steam
Garry's Mod|steam
Arma 3|steam
DayZ|steam
Squad|steam
Post Scriptum|steam
Hell Let Loose|steam
Insurgency Sandstorm|steam
Ground Branch|steam
Operator |steam
Rainbow Six Extraction|ubisoft-connect
For Honor|ubisoft-connect
Assassin's Creed Valhalla|ubisoft-connect
Assassin's Creed Mirage|ubisoft-connect
Watch Dogs Legion|ubisoft-connect
Far Cry 6|ubisoft-connect
Ghost Recon Breakpoint|ubisoft-connect
The Division 2|ubisoft-connect
R6 Siege|ubisoft-connect
FIFA 24|ea-app
EA Sports FC 25|ea-app
Madden NFL 25|ea-app
NHL 25|ea-app
Battlefield 2042|ea-app
Battlefield 1|ea-app
Battlefield V|ea-app
Star Wars Battlefront 2|ea-app
The Sims 4|ea-app
Plants vs Zombies|ea-app
Dragon Age Veilguard|ea-app
Apex Legends Mobile|ea-app
Valorant Mobile|riot
Wild Rift|riot
2XKO|riot
Teamfight Tactics|riot
Legends of Runeterra|riot
Fortnite Creative|epic
Rocket Racing|epic
LEGO Fortnite|epic
Fall Guys|epic
Gears of War 5|epic
Borderlands 3|epic
Control|epic
Death Stranding|epic
Metro Exodus|epic
Hitman 3|epic
Tomb Raider Shadow|epic
Jump Force|epic
World of Warcraft|battle-net
Diablo IV|battle-net
Hearthstone|battle-net
Heroes of the Storm|battle-net
StarCraft II|battle-net
Warcraft III|battle-net
Overwatch Classic|battle-net
Call of Duty Black Ops 6|battle-net
Call of Duty MW III|battle-net
Destiny 2|battle-net
Dubious Depot|manual
Minecraft Bedrock|microsoft-store
Forza Motorsport|xbox
Fable|xbox
Avowed|xbox
The Outer Worlds 2|xbox
Call of Duty Black Ops 6|xbox
Indiana Jones Great Circle|xbox
Hellblade 2|xbox
Alan Wake 2|epic
Playground|microsoft-store
Palworld|steam
Enshrouded|steam
Valheim|steam
Sons of the Forest|steam
The Forest|steam
ARK Survival Evolved|steam
Conan Exiles|steam
Raft|steam
Subnautica|steam
Green Hell|steam
The Long Dark|steam
Don't Starve Together|steam
Project Zomboid|steam
7 Days to Die|steam
Vampire Survivors|steam
Brotato|steam
Vulkanoid|steam
Risk of Rain 2|steam
Dead Cells|steam
Enter the Gungeon|steam
Cuphead|steam
Ori and the Will of the Wisps|steam
Celeste|steam
Hades II|steam
Baldur's Gate II|steam
Divinity Original Sin 2|steam
Pillars of Eternity|steam
Pathfinder Wrath of the Righteous|steam
Dragon Age Inquisition|steam
Mass Effect Andromeda|steam
The Witcher 2|steam
Deus Ex Mankind Divided|steam
Dishonored 2|steam
Prey|steam
Bioshock Infinite|steam
Borderlands 2|steam
Borderlands Pre-Sequel|steam
Shadowrun Returns|steam
XCOM 2|steam
XCOM Enemy Unknown|steam
Civilization VI|steam
Civilization VII|steam
Total War Warhammer 3|steam
Crusader Kings 3|steam
Europa Universalis IV|steam
Hearts of Iron IV|steam
Stellaris|steam
Victoria 3|steam
Cities Skylines 2|steam
Cities Skylines|steam
Factorio|steam
Satisfactory|steam
Timberborn|steam
Oxygen Not Included|steam
RimWorld|steam
Dwarf Fortress|steam
Minecraft Java|manual
Roblox|manual
Geometry Dash|steam
Beat Saber|manual
 osu!|manual
Astroneer|steam
No Man's Sky|steam
Elite Dangerous|steam
EVE Online|steam
Star Citizen|manual
Microsoft Flight Simulator|xbox
Kerbal Space Program|steam
Carrier Command|steam
Farm Manager|steam
Football Manager 25|steam
Pro Evolution Soccer|steam
eFootball|steam
Racing League|manual
Trackmania|steam
Dirt 5|steam
F1 24|ea-app
Need for Speed Unbound|ea-app
Burnout Paradise|steam
Forza Horizon 4|xbox
Assetto Corsa|steam
iRacing|steam
Euro Truck Simulator 2|steam
American Truck Simulator|steam
Train Sim World|steam
The Crew 2|ubisoft-connect
Watch Dogs 2|ubisoft-connect
Just Cause 4|steam
Sleeping Dogs|steam
Mafia Definitive Edition|steam
Hitman Absolution|steam
Splinter Cell|ubisoft-connect
Prince of Persia Lost Crown|ubisoft-connect
Assassin's Creed Origins|ubisoft-connect
Far Cry 5|ubisoft-connect
Ghost Recon Wildlands|ubisoft-connect
The Division|ubisoft-connect
Skull and Bones|ubisoft-connect
Star Wars Jedi Survivor|ea-app
Star Wars Jedi Fallen Order|ea-app
Dead Space|ea-app
Alan Wake|steam
Resident Evil 4|steam
Resident Evil Village|steam
Resident Evil 3|steam
Resident Evil 2|steam
Silent Hill 2|steam
Outlast|steam
Amnesia The Dark Descent|steam
Layers of Fear|steam
The Evil Within|steam
Dead by Daylight Mobile|manual
Final Fantasy VII Remake|steam
Final Fantasy XVI|steam
Final Fantasy XV|steam
Kingdom Hearts 3|steam
Persona 5 Royal|steam
Yakuza 0|steam
Yakuza Kiwami|steam
Nier Automata|steam
Sekiro|steam
Ghost of Tsushima|steam
Spider-Man Remastered|steam
Spider-Man Miles Morales|steam
Ratchet and Clank|steam
God of War|steam
Horizon Zero Dawn|steam
Bloodborne|manual
Demon's Souls|manual
Uncharted 4|manual
Last of Us Part II|manual
Battlefield 3|ea-app
Battlefield 4|ea-app
Crysis 3|steam
Far Cry 3|ubisoft-connect
Deus Ex Human Revolution|steam
Mass Effect 2|steam
Saints Row|steam
Just Cause 3|steam
Watch Dogs|ubisoft-connect
Assassin's Creed Syndicate|ubisoft-connect
Assassin's Creed Unity|ubisoft-connect
Far Cry Primal|ubisoft-connect
Tom Clancy's EndWar|ubisoft-connect
Gears Tactics|xbox
Halo 5|xbox
Halo 4|xbox
Halo Reach|xbox
Destiny 2 Lightfall|battle-net
Division 2|ubisoft-connect
Deep Rock Galactic|steam
Warhammer Vermintide 2|steam
Warhammer Darktide|steam
Killing Floor 3|steam
Left 4 Dead 2|steam
Payday 3|steam
GTFO|steam
Helldivers 2|steam
Lethal Company|steam
Content Warning|steam
R.E.P.O.|steam
Phasmophobia|steam
Among Us VR|manual
VRChat|steam
Rec Room|steam
`;

function seedGame(name: string, launcher: Launcher, verified: Verified[]): GameEntry {
  const found = verified.find((v) => v[0].toLowerCase() === name.toLowerCase());
  const hint = found?.[2]?.[0];
  const executableHints = found?.[2] ?? (hint ? [hint] : []);
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    launcher: found?.[1] ?? launcher,
    executableHints,
    verifiedDetection: Boolean(found && found[2].length > 0),
    icon: found ? "verified" : "manual",
  };
}

function fromConfiguration(config: (typeof GAME_CONFIGURATIONS)[number]): GameEntry {
  return {
    id: config.id,
    name: config.name,
    detail: config.detail,
    launcher: config.launchers[0] as Launcher,
    executableHints: [...config.executableNames, ...config.processNames],
    verifiedDetection: config.detection.confidence === "verified",
    icon: "verified",
    category: config.category,
    launchers: config.launchers as Launcher[],
    detectionConfidence: config.detection.confidence,
    verificationStatus: config.verification.status,
    supportedFeatures: [...config.supportedFeatures],
    unsupportedFeatures: [...config.unsupportedFeatures],
    configurationStatus: config.detection.requiresManualPath ? "manual" : "ready",
    releaseStatus: config.releaseStatus,
    configurationSource: config.configurationSource,
  };
}

const NORMALIZE = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const LEGACY_ENTRIES: GameEntry[] = [
  ...VERIFIED.map(([name, launcher, hints]) => seedGame(name, launcher, VERIFIED)),
  ...CATALOG.split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("|"))
    .map((line) => {
      const [name, launcher] = line.split("|") as [string, Launcher];
      return seedGame(name.trim(), launcher, VERIFIED);
    }),
];

const DATABASE_ENTRIES = GAME_CONFIGURATIONS.map(fromConfiguration);
const seenIds = new Set<string>();
const seenNames = new Set<string>();

export const GAME_CATALOG: GameEntry[] = [...DATABASE_ENTRIES, ...LEGACY_ENTRIES].filter((game) => {
  const nameKey = NORMALIZE(game.name);
  if (seenIds.has(game.id) || seenNames.has(nameKey)) return false;
  seenIds.add(game.id);
  seenNames.add(nameKey);
  return true;
});

export const DATABASE_GAME_COUNT = DATABASE_ENTRIES.length;
