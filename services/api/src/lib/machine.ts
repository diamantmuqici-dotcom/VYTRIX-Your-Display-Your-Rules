import { sha256Hex } from './crypto.js';

const MACHINE_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

/** Accept bounded hardware identifiers (UUID, hex serial, or similar). */
export function isValidMachineId(value: unknown): value is string {
  return typeof value === 'string' && MACHINE_ID_PATTERN.test(value.trim());
}

/**
 * Hash a client-supplied machine id with the server pepper.
 * The raw id is never persisted; only the returned digest is stored.
 */
export function hashMachineId(machineId: string, pepper: string): string {
  const normalized = machineId.trim().toLowerCase();
  return sha256Hex(`${pepper}\u0000${normalized}`);
}
