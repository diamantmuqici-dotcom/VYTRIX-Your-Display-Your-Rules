import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRANSFER_COOLDOWN_MS, TRIAL_DURATION_MS,
  evaluateLicense, matchesMachine, transitionActivate, transitionTransfer,
} from '../src/lib/license.ts';
import { hashMachineId } from '../src/lib/machine.ts';

const NOW = new Date('2026-01-01T00:00:00.000Z');
const after = (ms) => new Date(NOW.getTime() + ms);

const trial = () => ({
  plan: 'TRIAL',
  status: 'ACTIVE',
  machineHash: null,
  machineName: null,
  activatedAt: null,
  transferAt: null,
  expiresAt: null,
});

test('trial starts its 7-day clock on first activation', () => {
  const result = transitionActivate(trial(), 'abc123hash', 'Desk PC', NOW);
  assert.equal(result.ok, true);
  assert.equal(result.action, 'trial-started');
  assert.equal(result.next.activatedAt.getTime(), NOW.getTime());
  assert.equal(result.next.expiresAt.getTime(), after(TRIAL_DURATION_MS).getTime());
  assert.equal(matchesMachine(result.next, 'abc123hash'), true);
});

test('unactivated trial is a valid but unbound entitlement', () => {
  const evaluation = evaluateLicense(trial(), NOW);
  assert.equal(evaluation.valid, true);
  assert.equal(evaluation.verdict, 'active');
  assert.equal(evaluation.machineBound, false);
});

test('trial past its expiry is reported expired', () => {
  const license = { ...trial(), activatedAt: NOW, expiresAt: after(TRIAL_DURATION_MS) };
  const evaluation = evaluateLicense(license, after(TRIAL_DURATION_MS + 1));
  assert.equal(evaluation.valid, false);
  assert.equal(evaluation.verdict, 'expired');
  assert.equal(transitionActivate(license, 'newhash123', 'PC', after(TRIAL_DURATION_MS + 1)).ok, false);
});

test('reactivating the same machine is idempotent', () => {
  const bound = transitionActivate(trial(), 'samehash1', 'Desk', NOW).next;
  const result = transitionActivate(bound, 'samehash1', 'Renamed Desk', after(60_000));
  assert.equal(result.ok, true);
  assert.equal(result.action, 'already-bound');
  assert.equal(result.next, bound);
});

test('rebinding to a different machine counts as a transfer and starts the cooldown', () => {
  const bound = transitionActivate(trial(), 'machine-a', 'Desk', NOW).next;
  const rebound = transitionActivate(bound, 'machine-b', 'Laptop', after(60_000));
  assert.equal(rebound.ok, true);
  assert.equal(rebound.action, 'transferred');
  assert.equal(rebound.next.machineHash, 'machine-b');
  assert.equal(rebound.next.transferAt.getTime(), after(60_000).getTime());

  const blocked = transitionActivate(rebound.next, 'machine-c', 'Third', after(61_000));
  assert.equal(blocked.ok, false);
  assert.equal(blocked.verdict, 'transfer-cooldown');
  assert.equal(blocked.availableAt.getTime(), after(60_000).getTime() + TRANSFER_COOLDOWN_MS);
});

test('transfer unbinds the machine and enforces a 7-day cooldown', () => {
  const bound = { ...trial(), plan: 'LIFETIME', machineHash: 'machine-a', activatedAt: NOW };
  const transfer = transitionTransfer(bound, after(60_000));
  assert.equal(transfer.ok, true);
  assert.equal(transfer.action, 'transfer-ready');
  assert.equal(transfer.next.machineHash, null);
  assert.equal(transfer.next.machineName, null);

  const blocked = transitionActivate(transfer.next, 'machine-b', 'Laptop', after(60_000 + TRANSFER_COOLDOWN_MS - 1));
  assert.equal(blocked.ok, false);
  assert.equal(blocked.verdict, 'transfer-cooldown');
  assert.equal(blocked.availableAt.getTime(), after(60_000).getTime() + TRANSFER_COOLDOWN_MS);

  const rebind = transitionActivate(transfer.next, 'machine-b', 'Laptop', after(60_000 + TRANSFER_COOLDOWN_MS));
  assert.equal(rebind.ok, true);
  assert.equal(rebind.next.machineHash, 'machine-b');
});

test('lifetime licenses never expire and canceled ones are rejected', () => {
  const lifetime = { ...trial(), plan: 'LIFETIME', machineHash: 'machine-a', activatedAt: NOW };
  assert.equal(evaluateLicense(lifetime, after(100 * 365 * 86_400_000)).valid, true);
  const canceled = { ...lifetime, status: 'CANCELED' };
  assert.equal(evaluateLicense(canceled, NOW).verdict, 'canceled');
  assert.equal(transitionActivate(canceled, 'machine-b', 'PC', NOW).ok, false);
});

test('machine hashes use the pepper and never equal the raw id', () => {
  const raw = 'a1b2c3d4-1234-5678-9abc-def012345678';
  const hash = hashMachineId(raw, 'pepper-one');
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.notEqual(hash, raw);
  assert.notEqual(hash, hashMachineId(raw, 'pepper-two'));
  assert.equal(hash, hashMachineId(`  ${raw.toUpperCase()}  `, 'pepper-one'));
});
