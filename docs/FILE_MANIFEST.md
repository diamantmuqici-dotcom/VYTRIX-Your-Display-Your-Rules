# VYTRIX File Manifest

Generated: 2026-11-21. Purpose: repository map for audit and phase tracking.
Paths are relative to `VYTRIX/`. Generated outputs and ignored dependencies are excluded.

| File | Purpose |
| --- | --- |
| ``.editorconfig`` | Root editor consistency rules |
| ``CONTRIBUTING.md`` | Development workflow and code rules |
| ``SECURITY.md`` | Security policy and release requirements |
| ``turbo.json`` | Optional task orchestration configuration |
| `.env.example` | Root workspace configuration |
| `.github/dependabot.yml` | CI, release, or issue-template automation |
| `.github/ISSUE_TEMPLATE/bug.yml` | CI, release, or issue-template automation |
| `.github/ISSUE_TEMPLATE/feature.yml` | CI, release, or issue-template automation |
| `.github/workflows/ci.yml` | CI, release, or issue-template automation |
| `.github/workflows/release.yml` | CI, release, or issue-template automation |
| `.gitignore` | Root workspace configuration |
| `apps/desktop/index.html` | Desktop app build or HTML entry |
| `apps/desktop/overlay.html` | Desktop app build or HTML entry |
| `apps/desktop/package.json` | Desktop app build or HTML entry |
| `apps/desktop/src/App.tsx` | Desktop frontend foundation file |
| `apps/desktop/src/app/sections.ts` | Desktop frontend foundation file |
| `apps/desktop/src/components/charts/LineChart.tsx` | Reusable desktop UI component |
| `apps/desktop/src/components/sliders/ParamSlider.tsx` | Reusable desktop UI component |
| `apps/desktop/src/components/ui/Logo.tsx` | Reusable desktop UI component |
| `apps/desktop/src/components/ui/Panel.tsx` | Reusable desktop UI component |
| `apps/desktop/src/components/ui/ToggleRow.tsx` | Reusable desktop UI component |
| `apps/desktop/src/data/games.ts` | Static desktop catalog or task data |
| `apps/desktop/src/data/optimizer.ts` | Static desktop catalog or task data |
| `apps/desktop/src/data/presets.ts` | Static desktop catalog or task data |
| `apps/desktop/src/hooks/useHotkeyBridge.tsx` | React bridge hook for native events |
| `apps/desktop/src/hooks/usePhoneBridge.tsx` | React bridge hook for native events |
| `apps/desktop/src/hooks/useToast.tsx` | React bridge hook for native events |
| `apps/desktop/src/main.tsx` | Desktop frontend foundation file |
| `apps/desktop/src/pages/ColorStudio/index.tsx` | Desktop UI page |
| `apps/desktop/src/pages/Crosshair/index.tsx` | Desktop UI page |
| `apps/desktop/src/pages/Display/index.tsx` | Desktop UI page |
| `apps/desktop/src/pages/Effects/index.tsx` | Desktop UI page |
| `apps/desktop/src/pages/GameProfiles/index.tsx` | Desktop UI page |
| `apps/desktop/src/pages/Hotkeys/index.tsx` | Desktop UI page |
| `apps/desktop/src/pages/Optimizer/index.tsx` | Desktop UI page |
| `apps/desktop/src/pages/Overview/index.tsx` | Desktop UI page |
| `apps/desktop/src/pages/Performance/index.tsx` | Desktop UI page |
| `apps/desktop/src/pages/PhoneControl/index.tsx` | Desktop UI page |
| `apps/desktop/src/pages/PresetLibrary/index.tsx` | Desktop UI page |
| `apps/desktop/src/pages/Settings/index.tsx` | Desktop UI page |
| `apps/desktop/src/pages/Themes/index.tsx` | Desktop UI page |
| `apps/desktop/src/i18n/index.ts` | EN/FR/DE/RU dictionaries and translation hooks |
| `apps/desktop/src/services/color.ts` | Debounced native gamma-ramp apply/reset bridge |
| `apps/desktop/src/services/overlay.ts` | Frontend service wrapper for native IPC |
| `apps/desktop/src/services/tauri.ts` | Frontend service wrapper for native IPC |
| `apps/desktop/src/stores/app.tsx` | Shared desktop application state |
| `apps/desktop/src/styles/global.css` | Global styles and design tokens |
| `apps/desktop/src/utils/download.ts` | Desktop frontend foundation file |
| `apps/desktop/src-tauri/build.rs` | Tauri native project config, icons, schemas, or entrypoint |
| `apps/desktop/src-tauri/capabilities/default.json` | Tauri native project config, icons, schemas, or entrypoint |
| `apps/desktop/src-tauri/Cargo.lock` | Tauri native project config, icons, schemas, or entrypoint |
| `apps/desktop/src-tauri/Cargo.toml` | Tauri native project config, icons, schemas, or entrypoint |
| `apps/desktop/src-tauri/icons/128x128.png` | Tauri native project config, icons, schemas, or entrypoint |
| `apps/desktop/src-tauri/icons/128x128@2x.png` | Tauri native project config, icons, schemas, or entrypoint |
| `apps/desktop/src-tauri/icons/32x32.png` | Tauri native project config, icons, schemas, or entrypoint |
| `apps/desktop/src-tauri/icons/icon.ico` | Tauri native project config, icons, schemas, or entrypoint |
| `apps/desktop/src-tauri/icons/icon.png` | Tauri native project config, icons, schemas, or entrypoint |
| `apps/desktop/src-tauri/src/commands/mod.rs` | Typed native IPC command implementations |
| `apps/desktop/src-tauri/src/color.rs` | Bounded gamma-ramp state and native apply/reset |
| `apps/desktop/src-tauri/src/steam.rs` | Read-only Steam library and manifest detection |
| `apps/desktop/src-tauri/src/display/mod.rs` | Native Windows engine module |
| `apps/desktop/src-tauri/src/games/mod.rs` | Native Windows engine module |
| `apps/desktop/src-tauri/src/gpu/mod.rs` | Native Windows engine module |
| `apps/desktop/src-tauri/src/hotkeys/mod.rs` | Native Windows engine module |
| `apps/desktop/src-tauri/src/lib.rs` | Tauri native project config, icons, schemas, or entrypoint |
| `apps/desktop/src-tauri/src/main.rs` | Tauri native project config, icons, schemas, or entrypoint |
| `apps/desktop/src-tauri/src/monitoring/mod.rs` | Native Windows engine module |
| `apps/desktop/src-tauri/src/optimizer/mod.rs` | Native Windows engine module |
| `apps/desktop/src-tauri/src/overlay/mod.rs` | Native Windows engine module |
| `apps/desktop/src-tauri/src/phone/mod.rs` | Native Windows engine module |
| `apps/desktop/src-tauri/src/security/mod.rs` | Native Windows engine module |
| `apps/desktop/src-tauri/src/storage/mod.rs` | Native Windows engine module |
| `apps/desktop/src-tauri/src/system/mod.rs` | Native Windows engine module |
| `apps/desktop/src-tauri/src/win/mod.rs` | Native Windows engine module |
| `apps/desktop/src-tauri/tauri.conf.json` | Tauri native project config, icons, schemas, or entrypoint |
| `apps/desktop/tests/ui.test.mjs` | Desktop app build or HTML entry |
| `apps/desktop/tsconfig.json` | Desktop app build or HTML entry |
| `apps/desktop/vite.config.ts` | Desktop app build or HTML entry |
| `apps/mobile-control/index.html` | Phone companion web app |
| `apps/mobile-control/package.json` | Phone companion web app |
| `apps/mobile-control/README.md` | Phone companion web app |
| `apps/mobile-control/src/App.tsx` | Phone companion web app |
| `apps/mobile-control/src/client.ts` | Phone companion web app |
| `apps/mobile-control/src/components/ColorPad.tsx` | Phone companion web app |
| `apps/mobile-control/src/components/PairForm.tsx` | Phone companion web app |
| `apps/mobile-control/src/components/PinInput.tsx` | Phone companion web app |
| `apps/mobile-control/src/components/PresetGrid.tsx` | Phone companion web app |
| `apps/mobile-control/src/components/StatusBar.tsx` | Phone companion web app |
| `apps/mobile-control/src/main.tsx` | Phone companion web app |
| `apps/mobile-control/src/styles.css` | Phone companion web app |
| `apps/mobile-control/src/types.ts` | Phone companion web app |
| `apps/mobile-control/tsconfig.json` | Phone companion web app |
| `apps/mobile-control/vite.config.ts` | Phone companion web app |
| `apps/overlay/index.html` | Standalone overlay web app |
| `apps/overlay/package.json` | Standalone overlay web app |
| `apps/overlay/README.md` | Standalone overlay web app |
| `apps/overlay/src/App.tsx` | Standalone overlay web app |
| `apps/overlay/src/config.ts` | Standalone overlay web app |
| `apps/overlay/src/main.tsx` | Standalone overlay web app |
| `apps/overlay/src/styles.css` | Standalone overlay web app |
| `apps/overlay/src/types.ts` | Standalone overlay web app |
| `apps/overlay/tsconfig.json` | Standalone overlay web app |
| `apps/overlay/vite.config.ts` | Standalone overlay web app |
| `apps/updater/Cargo.lock` | Rust updater crate |
| `apps/updater/Cargo.toml` | Rust updater crate |
| `apps/updater/public_key.hex` | Rust updater crate |
| `apps/updater/README.md` | Rust updater crate |
| `apps/updater/src/main.rs` | Rust updater crate |
| `apps/website/app/account/page.tsx` | Next.js route or layout |
| `apps/website/app/changelog/page.tsx` | Next.js route or layout |
| `apps/website/app/discord/page.tsx` | Next.js route or layout |
| `apps/website/app/docs/page.tsx` | Next.js route or layout |
| `apps/website/app/download/page.tsx` | Next.js route or layout |
| `apps/website/app/faq/page.tsx` | Next.js route or layout |
| `apps/website/app/features/page.tsx` | Next.js route or layout |
| `apps/website/app/forgot-password/page.tsx` | Next.js route or layout |
| `apps/website/app/globals.css` | Next.js route or layout |
| `apps/website/app/layout.tsx` | Next.js route or layout |
| `apps/website/app/legal/privacy/page.tsx` | Next.js route or layout |
| `apps/website/app/legal/refunds/page.tsx` | Next.js route or layout |
| `apps/website/app/legal/terms/page.tsx` | Next.js route or layout |
| `apps/website/app/login/page.tsx` | Next.js route or layout |
| `apps/website/app/not-found.tsx` | Next.js route or layout |
| `apps/website/app/page.tsx` | Next.js route or layout |
| `apps/website/app/presets/page.tsx` | Next.js route or layout |
| `apps/website/app/pricing/page.tsx` | Next.js route or layout |
| `apps/website/app/robots.ts` | Next.js route or layout |
| `apps/website/app/security/page.tsx` | Next.js route or layout |
| `apps/website/app/signup/page.tsx` | Next.js route or layout |
| `apps/website/app/sitemap.ts` | Next.js route or layout |
| `apps/website/components/animated-gradient.tsx` | Website component |
| `apps/website/components/auth-form.tsx` | Website component |
| `apps/website/components/before-after-slider.tsx` | Website component |
| `apps/website/components/button.tsx` | Website component |
| `apps/website/components/container.tsx` | Website component |
| `apps/website/components/copy-code-button.tsx` | Website component |
| `apps/website/components/discord-redirect.tsx` | Website component |
| `apps/website/components/faq-accordion.tsx` | Website component |
| `apps/website/components/glass-card.tsx` | Website component |
| `apps/website/components/legal-page.tsx` | Website component |
| `apps/website/components/page-hero.tsx` | Website component |
| `apps/website/components/price-card.tsx` | Website component |
| `apps/website/components/providers.tsx` | Website component |
| `apps/website/components/reveal.tsx` | Website component |
| `apps/website/components/section.tsx` | Website component |
| `apps/website/components/site-footer.tsx` | Website component |
| `apps/website/components/site-header.tsx` | Website component |
| `apps/website/components/theme-toggle.tsx` | Website component |
| `apps/website/lib/content.ts` | Website support module |
| `apps/website/lib/site.ts` | Website support module |
| `apps/website/lib/utils.ts` | Website support module |
| `apps/website/next.config.ts` | Website config or build file |
| `apps/website/next-env.d.ts` | Website config or build file |
| `apps/website/package.json` | Website config or build file |
| `apps/website/postcss.config.mjs` | Website config or build file |
| `apps/website/public/branding/og.png` | Website public asset |
| `apps/website/public/branding/vytrix.png` | Website public asset |
| `apps/website/public/branding/vytrix-black.svg` | Website public asset |
| `apps/website/public/branding/vytrix-gradient.svg` | Website public asset |
| `apps/website/public/branding/vytrix-icon.svg` | Website public asset |
| `apps/website/public/branding/vytrix-white.svg` | Website public asset |
| `apps/website/public/branding/vytrix-wordmark.svg` | Website public asset |
| `apps/website/public/favicon.ico` | Website public asset |
| `apps/website/tailwind.config.ts` | Website config or build file |
| `apps/website/tsconfig.json` | Website config or build file |
| `assets/branding/favicon.ico` | Original VYTRIX branding asset |
| `assets/branding/README.md` | Original VYTRIX branding asset |
| `assets/branding/vytrix.ico` | Original VYTRIX branding asset |
| `assets/branding/vytrix.png` | Original VYTRIX branding asset |
| `assets/branding/vytrix-256.png` | Original VYTRIX branding asset |
| `assets/branding/vytrix-64.png` | Original VYTRIX branding asset |
| `assets/branding/vytrix-black.svg` | Original VYTRIX branding asset |
| `assets/branding/vytrix-discord-icon.png` | Original VYTRIX branding asset |
| `assets/branding/vytrix-gradient.svg` | Original VYTRIX branding asset |
| `assets/branding/vytrix-icon.svg` | Original VYTRIX branding asset |
| `assets/branding/vytrix-social.png` | Original VYTRIX branding asset |
| `assets/branding/vytrix-white.svg` | Original VYTRIX branding asset |
| `CHANGELOG.md` | Project root document |
| `database/migrations/0001_init/migration.sql` | Database migration |
| `database/migrations/migration_lock.toml` | Database migration |
| `database/schema.prisma` | Prisma schema or seed |
| `database/seed.mjs` | Prisma schema or seed |
| `docs/ARCHITECTURE.md` | Product documentation |
| `docs/BUILDING.md` | Product documentation |
| `docs/FAQ.md` | Product documentation |
| `docs/FEATURE_MATRIX.md` | New feature status matrix |
| `docs/IMPLEMENTATION_PLAN.md` | New phased implementation plan |
| `docs/INSTALLATION.md` | Product documentation |
| `docs/PROJECT_AUDIT.md` | New audit of existing implementation and gaps |
| `docs/RELEASING.md` | Product documentation |
| `docs/SECURITY.md` | Product documentation |
| `docs/SECURITY-CHECKLIST.md` | Product documentation |
| `docs/UPDATER.md` | Product documentation |
| `LICENSE` | Project root document |
| `package.json` | Root workspace configuration |
| `package-lock.json` | Root workspace configuration |
| `packages/config/package.json` | Shared package config |
| `packages/config/src/index.ts` | Shared package source |
| `packages/config/tsconfig.json` | Shared package config |
| `packages/design-system/package.json` | Shared package config |
| `packages/design-system/src/css.d.ts` | Shared package source |
| `packages/design-system/src/index.ts` | Shared package source |
| `packages/design-system/src/tokens.css` | Shared package source |
| `packages/design-system/src/tokens.ts` | Shared package source |
| `packages/design-system/tsconfig.json` | Shared package config |
| `packages/preset-format/package.json` | Shared package config |
| `packages/preset-format/src/index.ts` | Shared package source |
| `packages/preset-format/test/preset.test.mjs` | Shared package config |
| `packages/preset-format/tsconfig.json` | Shared package config |
| `packages/shared-types/package.json` | Shared package config |
| `packages/shared-types/src/index.ts` | Shared package source |
| `packages/shared-types/tsconfig.json` | Shared package config |
| `packages/validation/package.json` | Shared package config |
| `packages/validation/src/index.ts` | Shared package source |
| `packages/validation/tsconfig.json` | Shared package config |
| `pnpm-workspace.yaml` | Root workspace configuration |
| `README.md` | Project root document |
| `scripts/build-release.mjs` | Build, release, domain, or asset script |
| `scripts/check-domain.mjs` | Build, release, domain, or asset script |
| `scripts/gen_branding.py` | Build, release, domain, or asset script |
| `scripts/gen_social.py` | Build, release, domain, or asset script |
| `scripts/sign-manifest.mjs` | Build, release, domain, or asset script |
| `services/api/.env.example` | Backend config or entrypoint |
| `services/api/.gitignore` | Backend config or entrypoint |
| `services/api/package.json` | Backend config or entrypoint |
| `services/api/README.md` | Backend config or entrypoint |
| `services/api/src/env.ts` | Backend config or entrypoint |
| `services/api/src/lib/crypto.ts` | Backend support module |
| `services/api/src/lib/duration.ts` | Backend support module |
| `services/api/src/lib/errors.ts` | Backend support module |
| `services/api/src/lib/jwt.ts` | Backend support module |
| `services/api/src/lib/license.ts` | Backend support module |
| `services/api/src/lib/machine.ts` | Backend support module |
| `services/api/src/lib/password.ts` | Backend support module |
| `services/api/src/lib/preset-validation.ts` | Backend support module |
| `services/api/src/lib/storage.ts` | Backend support module |
| `services/api/src/plugins/auth.ts` | Backend support module |
| `services/api/src/plugins/db.ts` | Backend support module |
| `services/api/src/plugins/security.ts` | Backend support module |
| `services/api/src/routes/auth.ts` | Fastify API route group |
| `services/api/src/routes/billing.ts` | Fastify API route group |
| `services/api/src/routes/license.ts` | Fastify API route group |
| `services/api/src/routes/presets.ts` | Fastify API route group |
| `services/api/src/routes/releases.ts` | Fastify API route group |
| `services/api/src/routes/telemetry.ts` | Fastify API route group |
| `services/api/src/server.ts` | Backend config or entrypoint |
| `services/api/src/types/augment.d.ts` | Backend support module |
| `services/api/tests/license.test.mjs` | Backend test |
| `services/api/tests/preset-validation.test.mjs` | Backend test |
| `services/api/tsconfig.json` | Backend config or entrypoint |
| `tsconfig.base.json` | Root workspace configuration |

## Change log

- 2026-11-21: audit documents added; generated build outputs removed from Git tracking.
- 2026-11-21: Phase 4 game database, generators, validators, tests, desktop wiring, and native hints added.

## Phase 4 — Game database

| File | Purpose |
| --- | --- |
| `docs/GAME_DATABASE.md` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/package.json` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/tsconfig.json` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/src/capabilities.ts` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/src/categories.ts` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/src/compatibility.ts` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/src/defaults.ts` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/src/index.ts` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/src/launchers.ts` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/src/registry.ts` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/src/schema.ts` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/src/search.ts` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/src/validation.ts` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/src/versioning.ts` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/src/generated/game-index.ts` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/scripts/generate-seed-data.mjs` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/scripts/generate-index.mjs` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/scripts/validate-database.mjs` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/scripts/check-duplicates.mjs` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/tests/game-database.test.mjs` | Phase 4 package source, generator, validator, test, or generated artifact |
| `apps/desktop/src-tauri/src/games/generated_hints.rs` | Phase 4 package source, generator, validator, test, or generated artifact |
| `packages/game-database/data/additional/black-desert-online.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/additional/deep-rock-galactic.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/additional/helldivers-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/additional/minecraft-bedrock-edition.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/additional/minecraft-java-edition.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/additional/no-man-s-sky.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/additional/once-human.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/additional/overwatch-classic-where-available.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/additional/sea-of-thieves.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/additional/warframe.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/alan-wake-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/a-plague-tale-requiem.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/back-4-blood.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/control.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/dead-by-daylight.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/dead-island-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/doom-eternal.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/doom-the-dark-ages.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/dying-light-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/god-of-war.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/god-of-war-ragnaro-k.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/left-4-dead-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/marvel-s-spider-man-remastered.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/metro-exodus.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/outlast-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/resident-evil-4-remake.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/resident-evil-village.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/silent-hill-2-remake.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/the-last-of-us-part-i.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/horror/the-outlast-trials.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/index.json` | Validated database index |
| `packages/game-database/data/racing/american-truck-simulator.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/assetto-corsa.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/assetto-corsa-competizione.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/carx-drift-racing-online.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/euro-truck-simulator-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/f1-24.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/f1-25.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/farming-simulator-25.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/forza-horizon-5.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/forza-motorsport.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/iracing.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/microsoft-flight-simulator.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/need-for-speed-heat.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/need-for-speed-payback.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/need-for-speed-unbound.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/snowrunner.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/the-crew-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/the-crew-motorfest.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/trackmania.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/racing/wreckfest.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/black-myth-wukong.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/cyberpunk-2077.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/dark-souls-iii.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/elden-ring.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/fallout-4.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/genshin-impact.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/grand-theft-auto-v.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/grand-theft-auto-v-enhanced.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/hogwarts-legacy.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/honkai-star-rail.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/kingdom-come-deliverance-ii.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/monster-hunter-wilds.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/monster-hunter-world.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/red-dead-redemption-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/sekiro.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/skyrim-special-edition.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/starfield.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/the-witcher-3.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/where-winds-meet.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/rpg/wuthering-waves.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/among-us.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/beamng-drive.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/brawlhalla.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/buckshot-roulette.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/content-warning.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/crab-game.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/garry-s-mod.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/geometry-dash.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/human-fall-flat.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/lethal-company.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/peak.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/people-playground.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/phasmophobia.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/r-e-p-o.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/roblox.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/rob-run.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/schedule-i.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/stardew-valley.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/teardown.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/sandbox/terraria.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/apex-legends.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/arma-reforger.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/battlefield-2042.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/battlefield-6.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/battlefield-v.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/call-of-duty.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/call-of-duty-warzone.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/counter-strike-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/day-of-infamy.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/delta-force.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/destiny-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/escape-from-tarkov.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/fortnite.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/halo-infinite.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/hell-let-loose.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/hunt-showdown.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/insurgency-sandstorm.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/overwatch-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/paladins.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/pubg-battlegrounds.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/quake-champions.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/rainbow-six-siege.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/ready-or-not.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/splitgate.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/splitgate-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/squad.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/team-fortress-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/the-finals.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/valorant.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/shooters/xdefiant.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/age-of-empires-iv.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/anno-1800.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/cities-skylines-ii.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/civilization-vi.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/civilization-vii.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/company-of-heroes-3.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/crusader-kings-iii.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/deadlock.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/dota-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/dyson-sphere-program.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/europa-universalis-iv.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/factorio.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/hearts-of-iron-iv.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/league-of-legends.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/satisfactory.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/smite-2.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/starcraft-ii.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/teamfight-tactics.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/total-war-warhammer-iii.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/strategy/warcraft-iii.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/7-days-to-die.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/ark-survival-ascended.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/ark-survival-evolved.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/conan-exiles.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/dayz.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/don-t-starve-together.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/enshrouded.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/grounded.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/palworld.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/project-zomboid.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/raft.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/rust.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/scum.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/sons-of-the-forest.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/subnautica.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/subnautica-below-zero.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/the-forest.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/unturned.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/valheim.json` | Individual schema-valid game configuration record |
| `packages/game-database/data/survival/v-rising.json` | Individual schema-valid game configuration record |
