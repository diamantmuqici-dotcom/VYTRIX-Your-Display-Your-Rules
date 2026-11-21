export const LAUNCHERS = [
  "steam",
  "epic",
  "riot",
  "xbox",
  "microsoft-store",
  "battle-net",
  "ubisoft-connect",
  "ea-app",
  "manual",
] as const;

export type LauncherId = (typeof LAUNCHERS)[number];

export const LAUNCHER_LABELS: Record<LauncherId, string> = {
  steam: "Steam",
  epic: "Epic Games",
  riot: "Riot Client",
  xbox: "Xbox app",
  "microsoft-store": "Microsoft Store",
  "battle-net": "Battle.net",
  "ubisoft-connect": "Ubisoft Connect",
  "ea-app": "EA App",
  manual: "Manual path",
};

export function isLauncher(value: string): value is LauncherId {
  return (LAUNCHERS as readonly string[]).includes(value);
}
