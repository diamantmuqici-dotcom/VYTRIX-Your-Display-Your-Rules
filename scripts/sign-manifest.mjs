#!/usr/bin/env node
// Sign the staged release manifest with the Ed25519 release key.
// Canonical bytes are shared verbatim with apps/updater/src/main.rs.
import { createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CANONICAL_HEADER = 'VYTRIX-RELEASE-MANIFEST-V1';

function fail(message) {
  console.error(`sign-manifest: ${message}`);
  process.exit(1);
}

function canonicalBytes(manifest) {
  const lines = [
    CANONICAL_HEADER,
    `version=${manifest.version}`,
    `publishedAt=${manifest.publishedAt}`,
  ];
  if (!Array.isArray(manifest.files)) fail('manifest.files is not an array');

  for (const file of manifest.files) {
    for (const field of [file.name, file.url, file.sha256]) {
      if (typeof field !== 'string' || /[\r\n]/.test(field)) {
        fail(`manifest string field has a line break or wrong type: ${String(field)}`);
      }
    }
    if (!Number.isSafeInteger(file.size)) fail(`invalid size for ${file.name}`);
    lines.push(`file=${file.name}`);
    lines.push(`url=${file.url}`);
    lines.push(`sha256=${String(file.sha256).toLowerCase()}`);
    lines.push(`size=${String(file.size)}`);
  }
  return Buffer.from(`${lines.join('\n')}\n`, 'utf8');
}

function resolvePrivateKey() {
  const fromEnv = process.env.VYTRIX_RELEASE_PRIVATE_KEY;
  if (fromEnv) {
    if (fromEnv.includes('PRIVATE KEY')) return { pem: fromEnv, origin: 'VYTRIX_RELEASE_PRIVATE_KEY env (PEM)' };
    if (!existsSync(fromEnv)) fail(`VYTRIX_RELEASE_PRIVATE_KEY points to a missing file: ${fromEnv}`);
    return { pem: readFileSync(fromEnv, 'utf8'), origin: fromEnv };
  }

  const keyArgIndex = process.argv.indexOf('--key');
  const keyPath = keyArgIndex >= 0
    ? process.argv[keyArgIndex + 1]
    : path.join(ROOT, 'release-private-key.pem');
  if (!keyPath) fail('--key requires a path');
  if (!existsSync(keyPath)) {
    fail(`private key not found at ${keyPath}. Generate one with: openssl genpkey -algorithm ED25519 -out release-private-key.pem`);
  }
  return { pem: readFileSync(keyPath, 'utf8'), origin: keyPath };
}

function rawPublicHex(privateKey) {
  const spki = createPublicKey(privateKey).export({ format: 'der', type: 'spki' });
  return spki.subarray(-32).toString('hex');
}

function bundledPublicHex() {
  const keyPath = path.join(ROOT, 'apps', 'updater', 'public_key.hex');
  const compact = readFileSync(keyPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .join('');
  return compact.toLowerCase();
}

function main() {
  const manifestArgIndex = process.argv.indexOf('--manifest');
  const manifestPath = manifestArgIndex >= 0
    ? path.resolve(process.argv[manifestArgIndex + 1])
    : path.join(ROOT, 'dist-release', 'manifest.json');
  if (!existsSync(manifestPath)) {
    fail(`manifest not found at ${manifestPath}. Run node scripts/build-release.mjs first.`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.version === undefined || manifest.publishedAt === undefined || !Array.isArray(manifest.files)) {
    fail('manifest is missing version, publishedAt, or files');
  }

  const { pem, origin } = resolvePrivateKey();
  let privateKey;
  try {
    privateKey = createPrivateKey(pem);
  } catch (error) {
    fail(`could not parse private key from ${origin}: ${error.message}`);
  }
  if (privateKey.asymmetricKeyType !== 'ed25519') {
    fail(`private key must be Ed25519, got ${privateKey.asymmetricKeyType}`);
  }

  const expectedKey = bundledPublicHex();
  const actualKey = rawPublicHex(privateKey);
  if (/^0+$/.test(expectedKey)) {
    fail('apps/updater/public_key.hex still holds the all-zero placeholder. Replace it with the key printed below.');
  }
  if (expectedKey !== actualKey) {
    fail(`release key does not match apps/updater/public_key.hex.\n  bundled: ${expectedKey}\n  key:     ${actualKey}`);
  }

  const canonical = canonicalBytes(manifest);
  const signature = sign(null, canonical, privateKey).toString('hex');
  manifest.signature = signature;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`sign-manifest: signed ${manifest.version} (${manifest.files.length} artifact(s))`);
  console.log(`  key source: ${origin}`);
  console.log(`  public key: ${actualKey}`);
  console.log(`  signature:  ${signature}`);
  console.log(`  wrote:      ${path.relative(ROOT, manifestPath)}`);
}

main();
