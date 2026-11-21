import type { ColorSettings, DeviceState, PairSession } from "./types";

export type NumericColorField = Exclude<keyof ColorSettings, "temperatureK">;

// Mirrors packages/validation COLOR_RANGES. Values are enforced on every
// outgoing request and on every response parsed from the agent.
export const COLOR_RANGES: Record<NumericColorField, readonly [number, number]> = {
  saturation: [0, 300],
  vibrance: [0, 300],
  gamma: [50, 250],
  brightness: [0, 200],
  contrast: [0, 200],
  hue: [0, 360],
  red: [0, 200],
  green: [0, 200],
  blue: [0, 200],
};

export const TEMPERATURE_RANGE: readonly [number, number] = [1000, 12000];

export const DEFAULT_COLOR_SETTINGS: ColorSettings = {
  saturation: 100,
  vibrance: 100,
  gamma: 100,
  brightness: 100,
  contrast: 100,
  hue: 0,
  red: 100,
  green: 100,
  blue: 100,
  temperatureK: 6500,
};

export const MAX_ATTEMPTS = 3;
export const REQUEST_TIMEOUT_MS = 6000;
const MAX_RESPONSE_BYTES = 1_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeText(value: unknown, max: number, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
  return cleaned.length > 0 ? cleaned : fallback;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
  return value;
}

export function clampColorSettings(input: Partial<ColorSettings>): ColorSettings {
  if (!isRecord(input)) throw new Error("Color settings must be an object");
  const result: ColorSettings = { ...DEFAULT_COLOR_SETTINGS };

  for (const field of Object.keys(COLOR_RANGES) as NumericColorField[]) {
    const raw = input[field];
    if (raw === undefined) continue;
    const [min, max] = COLOR_RANGES[field];
    result[field] = clampNumber(requireFinite(raw, field), min, max);
  }

  const temperature = input.temperatureK;
  if (temperature !== undefined) {
    if (temperature === null) {
      result.temperatureK = null;
    } else {
      result.temperatureK = clampNumber(
        requireFinite(temperature, "temperatureK"),
        TEMPERATURE_RANGE[0],
        TEMPERATURE_RANGE[1],
      );
    }
  }

  return result;
}

function parseColorSettings(value: unknown): ColorSettings {
  const source = isRecord(value) ? value : {};
  const partial: Partial<ColorSettings> = {};
  for (const field of Object.keys(COLOR_RANGES) as NumericColorField[]) {
    const raw = source[field];
    if (raw === undefined) continue;
    partial[field] = requireFinite(raw, `color.${field}`);
  }
  const temperature = source.temperatureK;
  if (temperature !== undefined) {
    if (temperature === null) partial.temperatureK = null;
    else partial.temperatureK = requireFinite(temperature, "color.temperatureK");
  }
  return clampColorSettings(partial);
}

function parsePairSession(value: unknown): PairSession {
  if (!isRecord(value)) throw new Error("Pair response must be an object");
  const token = safeText(value.token, 256, "");
  if (token.length < 8) throw new Error("Pair response contained an invalid token");
  const expiresAt = requireFinite(value.expiresAt, "expiresAt");
  if (expiresAt <= Date.now() - 1000) throw new Error("Pairing token has already expired");
  return { token, expiresAt };
}

function parseDeviceState(value: unknown): DeviceState {
  if (!isRecord(value)) throw new Error("State response must be an object");
  const presets: DeviceState["presets"] = [];
  const rawPresets = Array.isArray(value.presets) ? value.presets.slice(0, 200) : [];
  for (const item of rawPresets) {
    if (!isRecord(item)) continue;
    const id = safeText(item.id, 120, "");
    const name = safeText(item.name, 80, "");
    if (!id || !name) continue;
    presets.push({
      id,
      name,
      category: safeText(item.category, 60, "General"),
      thumbnail: typeof item.thumbnail === "string" ? safeText(item.thumbnail, 240, "") || null : null,
    });
  }

  return {
    deviceName: safeText(value.deviceName, 80, "VYTRIX agent"),
    agentVersion: safeText(value.agentVersion, 40, "unknown"),
    paired: value.paired === true,
    expiresAt: requireFinite(value.expiresAt, "expiresAt"),
    color: parseColorSettings(value.color),
    activePresetId: typeof value.activePresetId === "string" && value.activePresetId.trim().length > 0
      ? safeText(value.activePresetId, 120, "")
      : null,
    crosshairEnabled: value.crosshairEnabled === true,
    presets,
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const text = (await response.text()).slice(0, 4096);
    if (!text) return response.statusText;
    const value: unknown = JSON.parse(text);
    if (isRecord(value) && typeof value.error === "string") return safeText(value.error, 160, "");
    return safeText(text, 160, "");
  } catch {
    return response.statusText;
  }
}

export function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter the PC address, for example http://192.168.1.20:8753");
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Enter a full URL, for example http://192.168.1.20:8753");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https addresses are supported");
  }
  if (parsed.username || parsed.password) throw new Error("Do not include credentials in the address");
  if (parsed.search || parsed.hash) throw new Error("Use the agent root address without a query or fragment");
  if (parsed.pathname.replace(/\/+$/, "") !== "") {
    throw new Error("Use the agent root address without a path");
  }
  return `${parsed.protocol}//${parsed.host}`;
}

interface RequestOptions {
  retry?: boolean;
  auth?: boolean;
}

export class VytrixClient {
  private readonly baseUrl: string;
  private currentSession: PairSession | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
  }

  get session(): PairSession | null {
    return this.currentSession;
  }

  disconnect(): void {
    this.currentSession = null;
  }

  async pair(code: string): Promise<PairSession> {
    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
      throw new Error("Pairing code must be exactly six digits");
    }
    const session = parsePairSession(
      await this.request<unknown>(
        "/pair",
        { method: "POST", body: JSON.stringify({ code }) },
        { auth: false },
      ),
    );
    this.currentSession = session;
    return session;
  }

  async getState(): Promise<DeviceState> {
    return parseDeviceState(await this.request<unknown>("/state", { method: "GET" }));
  }

  async setColor(settings: Partial<ColorSettings>): Promise<ColorSettings> {
    const clamped = clampColorSettings(settings);
    await this.request<unknown>("/color", {
      method: "POST",
      body: JSON.stringify({ settings: clamped }),
    });
    return clamped;
  }

  async applyPreset(id: string): Promise<void> {
    const presetId = safeText(id, 120, "");
    if (!presetId) throw new Error("Preset id is invalid");
    await this.request<unknown>("/preset", {
      method: "POST",
      body: JSON.stringify({ id: presetId }),
    });
  }

  async setCrosshair(enabled: boolean): Promise<boolean> {
    if (typeof enabled !== "boolean") throw new Error("Crosshair flag must be a boolean");
    await this.request<unknown>("/crosshair", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    });
    return enabled;
  }

  private async request<T>(path: string, init: RequestInit, options: RequestOptions = {}): Promise<T> {
    const retry = options.retry !== false;
    const withAuth = options.auth !== false;
    let lastError = new Error("Agent request failed");

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const headers = new Headers(init.headers);
        headers.set("Accept", "application/json");
        if (init.body !== undefined) headers.set("Content-Type", "application/json");
        if (withAuth && this.currentSession) {
          headers.set("Authorization", `Bearer ${this.currentSession.token}`);
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
          ...init,
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          const message = await readErrorMessage(response);
          const error = new Error(`HTTP ${response.status}${message ? `: ${message}` : ""}`);
          const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
          if (retry && retryable) {
            lastError = error;
            continue;
          }
          throw error;
        }

        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) {
          throw new Error("Agent response too large");
        }
        return JSON.parse(text) as T;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          lastError = new Error(`Timed out after ${REQUEST_TIMEOUT_MS} ms`);
        } else {
          lastError = error instanceof Error ? error : new Error(String(error));
        }
        if (!retry || attempt === MAX_ATTEMPTS) throw lastError;
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError;
  }
}
