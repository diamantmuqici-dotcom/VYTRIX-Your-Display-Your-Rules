// GitHub Pages project sites serve from /<repo>. Static <img> and metadata
// asset URLs are not rewritten by Next, so every public asset goes through here.
export const BASE_PATH =
  process.env.NEXT_PUBLIC_BASE_PATH ?? "/VYTRIX-Your-Display-Your-Rules";

export function asset(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}

export const SITE_NAME = "VYTRIX";
export const SITE_TAGLINE = "YOUR DISPLAY. YOUR RULES.";
export const SITE_DESCRIPTION =
  "VYTRIX is a free, open-source Windows 10/11 display and performance suite. Per-monitor color, game profiles, a crosshair overlay, utility zoom, SnapTap, a reversible optimizer and phone control — without injecting into games.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://diamantmuqici-dotcom.github.io/VYTRIX-Your-Display-Your-Rules";
export const GITHUB_URL =
  "https://github.com/diamantmuqici-dotcom/VYTRIX-Your-Display-Your-Rules";
export const RELEASE_URL =
  process.env.NEXT_PUBLIC_RELEASE_URL ?? `${GITHUB_URL}/releases/latest`;
export const DIRECT_EXE_URL =
  "https://github.com/diamantmuqici-dotcom/VYTRIX-Your-Display-Your-Rules/releases/latest/download/VYTRIX-x64-portable.exe";
export const DISCORD_URL = "https://discord.gg/AUABm6g68c";

export const mainNav = [
  { label: "Features", href: "/features" },
  { label: "Games", href: "/games" },
  { label: "Presets", href: "/presets" },
  { label: "Download", href: "/download" },
  { label: "Security", href: "/security" },
  { label: "Changelog", href: "/changelog" },
] as const;

export const utilityNav = [
  { label: "Docs", href: "/docs" },
  { label: "FAQ", href: "/faq" },
  { label: "Download", href: "/download" },
] as const;

export const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Games", href: "/games" },
      { label: "Presets", href: "/presets" },
      { label: "Download", href: "/download" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "FAQ", href: "/faq" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    title: "Source",
    links: [
      { label: "GitHub repository", href: GITHUB_URL },
      { label: "Latest release", href: RELEASE_URL },
      { label: "Portable exe", href: DIRECT_EXE_URL },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
    ],
  },
] as const;
