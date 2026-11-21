const UNITS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

/** Parse a bounded `ms`-style duration (e.g. `15m`, `7d`) into milliseconds. */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d|w)$/.exec(value.trim());
  if (!match || !match[1] || !match[2]) throw new Error(`Invalid duration: ${value}`);
  const amount = Number(match[1]);
  if (!Number.isSafeInteger(amount) || amount < 1) throw new Error(`Invalid duration: ${value}`);
  return amount * (UNITS[match[2]] as number);
}
