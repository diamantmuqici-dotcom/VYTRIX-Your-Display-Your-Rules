export type Plan = 'TRIAL' | 'MONTHLY' | 'LIFETIME';
export type LicenseStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED';

export type LicenseVerdict =
  | 'active'
  | 'no-license'
  | 'canceled'
  | 'expired'
  | 'transfer-cooldown';

export type LicenseAction =
  | 'activated'
  | 'already-bound'
  | 'trial-started'
  | 'transferred'
  | 'unbound'
  | 'transfer-ready';

export const TRANSFER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
export const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/** Persisted license fields relevant to entitlement decisions. */
export interface LicenseView {
  plan: Plan;
  status: LicenseStatus;
  machineHash: string | null;
  machineName: string | null;
  activatedAt: Date | null;
  transferAt: Date | null;
  expiresAt: Date | null;
}

export interface LicenseEvaluation {
  valid: boolean;
  verdict: LicenseVerdict;
  expiresAt: Date | null;
  machineBound: boolean;
}

export interface TransitionResult {
  ok: boolean;
  verdict: LicenseVerdict;
  availableAt: Date | null;
  action: LicenseAction | null;
  next: LicenseView | null;
}

function entitlementVerdict(license: LicenseView | null, now: Date): LicenseVerdict {
  if (!license) return 'no-license';
  if (license.status === 'CANCELED') return 'canceled';
  if (license.status === 'EXPIRED') return 'expired';
  if (license.expiresAt !== null && license.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'active';
}

function failure(verdict: LicenseVerdict): TransitionResult {
  return { ok: false, verdict, availableAt: null, action: null, next: null };
}

/** Pure entitlement evaluation; machine binding is reported but not judged. */
export function evaluateLicense(license: LicenseView | null, now: Date = new Date()): LicenseEvaluation {
  const verdict = entitlementVerdict(license, now);
  return {
    valid: verdict === 'active',
    verdict,
    expiresAt: license?.expiresAt ?? null,
    machineBound: license?.machineHash !== null && license?.machineHash !== undefined,
  };
}

/** True when the supplied machine hash is the one currently bound. */
export function matchesMachine(license: LicenseView | null, machineHash: string): boolean {
  return license?.machineHash === machineHash;
}

/** Advance a license to a machine binding, enforcing one machine and the transfer cooldown. */
export function transitionActivate(
  license: LicenseView | null,
  machineHash: string,
  machineName: string,
  now: Date = new Date(),
): TransitionResult {
  if (entitlementVerdict(license, now) !== 'active' || license === null) {
    return failure(entitlementVerdict(license, now));
  }

  if (license.machineHash === machineHash) {
    return {
      ok: true,
      verdict: 'active',
      availableAt: null,
      action: 'already-bound',
      next: license,
    };
  }

  let transferAt = license.transferAt;
  if (license.transferAt !== null) {
    const availableAt = new Date(license.transferAt.getTime() + TRANSFER_COOLDOWN_MS);
    if (now.getTime() < availableAt.getTime()) {
      return { ok: false, verdict: 'transfer-cooldown', availableAt, action: null, next: null };
    }
  }
  if (license.machineHash !== null) transferAt = now;

  const trialStarted = license.plan === 'TRIAL' && license.activatedAt === null;
  const next: LicenseView = {
    ...license,
    status: 'ACTIVE',
    machineHash,
    machineName,
    activatedAt: license.activatedAt ?? now,
    transferAt,
    expiresAt: trialStarted ? new Date(now.getTime() + TRIAL_DURATION_MS) : license.expiresAt,
  };

  const action: LicenseAction = trialStarted
    ? 'trial-started'
    : transferAt !== license.transferAt
      ? 'transferred'
      : 'activated';

  return { ok: true, verdict: 'active', availableAt: null, action, next };
}

/** Unbind the current machine so the license can be activated elsewhere. */
export function transitionTransfer(
  license: LicenseView | null,
  now: Date = new Date(),
): TransitionResult {
  const verdict = entitlementVerdict(license, now);
  if (verdict !== 'active' || license === null) return failure(verdict);

  if (license.machineHash === null) {
    return { ok: true, verdict: 'active', availableAt: null, action: 'unbound', next: license };
  }

  if (license.transferAt !== null) {
    const availableAt = new Date(license.transferAt.getTime() + TRANSFER_COOLDOWN_MS);
    if (now.getTime() < availableAt.getTime()) {
      return { ok: false, verdict: 'transfer-cooldown', availableAt, action: null, next: null };
    }
  }

  return {
    ok: true,
    verdict: 'active',
    availableAt: null,
    action: 'transfer-ready',
    next: { ...license, machineHash: null, machineName: null, transferAt: now },
  };
}
