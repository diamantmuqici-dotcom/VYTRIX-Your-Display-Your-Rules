#!/usr/bin/env node
// Stage a VYTRIX Windows release: build, hash every artifact, emit manifest + sidecars.
// The manifest is left UNSIGNED on purpose; run scripts/sign-manifest.mjs next.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'dist-release', 'manifest.json');
const DEFAULT_BASE_URL = (version) => `https://vytrix.gg/releases/${version}/`;
const ARTIFACT_EXTENSIONS = new Set(['.msi', '.exe', '.zip', '.7z']);
const SKIP_SUFFIXES = ['.sig', '.sha256'];

const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const versionIndex = args.indexOf('--version');
const versionArg = versionIndex >= 0 ? args[versionIndex + 1] : undefined;

function fail(message) {
  console.error(`build-release: ${message}`);
  process.exit(1);
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.error) fail(`${command} failed to start: ${result.error.message}`);
  if (result.status !== 0) fail(`${command} ${commandArgs.join(' ')} exited with ${result.status}`);
}

function readVersion() {
  if (versionArg) return versionArg;
  const configPath = path.join(ROOT, 'apps', 'desktop', 'src-tauri', 'tauri.conf.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  if (!config.version) fail('no version in apps/desktop/src-tauri/tauri.conf.json');
  return config.version;
}

function walk(directory) {
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...walk(full));
    } else if (entry.isFile()) {
      found.push(full);
    }
  }
  return found;
}

function isArtifact(filePath) {
  const name = path.basename(filePath).toLowerCase();
  if (SKIP_SUFFIXES.some((suffix) => name.endsWith(suffix))) return false;
  return ARTIFACT_EXTENSIONS.has(path.extname(name));
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function main() {
  const version = readVersion();
  const downloadBase = process.env.VYTRIX_RELEASE_BASE_URL || DEFAULT_BASE_URL(version);

  if (!skipBuild) {
    console.log('build-release: building workspace');
    run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);

    console.log('build-release: building Tauri bundles (msi + nsis)');
    run(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['@tauri-apps/cli', 'build'],
      { cwd: path.join(ROOT, 'apps', 'desktop', 'src-tauri') },
    );
  } else {
    console.log('build-release: --skip-build, staging existing bundle only');
  }

  const bundleDir = process.env.VYTRIX_BUNDLE_DIR
    ? path.resolve(process.env.VYTRIX_BUNDLE_DIR)
    : path.join(ROOT, 'apps', 'desktop', 'src-tauri', 'target', 'release', 'bundle');
  if (!existsSync(bundleDir)) fail(`bundle directory not found: ${bundleDir}`);

  const portableSource = path.join(ROOT, 'apps', 'desktop', 'src-tauri', 'target', 'release', 'vytrix.exe');
  if (!existsSync(portableSource)) fail(`portable executable not found: ${portableSource}`);
  const portableName = 'VYTRIX-x64-portable.exe';
  const portableDest = path.join(path.dirname(MANIFEST_PATH), portableName);
  mkdirSync(path.dirname(portableDest), { recursive: true });
  copyFileSync(portableSource, portableDest);

  const artifactPaths = [portableDest, ...walk(bundleDir).filter(isArtifact)]
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
  if (artifactPaths.length === 0) fail(`no installer artifacts found under ${bundleDir}`);

  const files = artifactPaths.map((filePath) => {
    const name = path.basename(filePath);
    const encoded = encodeURIComponent(name);
    return {
      name,
      url: `${downloadBase}${encoded}`,
      sha256: sha256(filePath),
      size: statSync(filePath).size,
    };
  });

  const manifest = {
    version,
    publishedAt: new Date().toISOString(),
    files,
    signature: '',
  };

  mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  for (const file of files) {
    writeFileSync(
      path.join(ROOT, 'dist-release', `${file.name}.sha256`),
      `${file.sha256}  ${file.name}\n`,
      'utf8',
    );
  }

  console.log(`build-release: staged ${files.length} artifact(s) for ${version}`);
  for (const file of files) {
    console.log(`  ${file.name}  ${file.sha256}  ${file.size} bytes`);
  }
  console.log(`build-release: wrote ${path.relative(ROOT, MANIFEST_PATH)} (unsigned)`);
  console.log('build-release: next step -> node scripts/sign-manifest.mjs');
}

main();
