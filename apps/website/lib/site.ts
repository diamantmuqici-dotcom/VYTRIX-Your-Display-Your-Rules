export const SITE_NAME = "VYTRIX";
export const SITE_TAGLINE = "YOUR DISPLAY. YOUR RULES.";
export const SITE_DESCRIPTION =
  "VYTRIX is a Windows 10/11 display and performance suite. Per-monitor color, game profiles, a crosshair overlay, utility zoom, SnapTap, a reversible optimizer and phone control — without injecting into games.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://diamantmuqici-dotcom.github.io/VYTRIX-Your-Display-Your-Rules";
export const RELEASE_URL =
  process.env.NEXT_PUBLIC_RELEASE_URL ??
  "https://github.com/diamantmuqici-dotcom/VYTRIX-Your-Display-Your-Rules/releases/latest";
export const DISCORD_URL = "https://discord.gg/AUABm6g68c";

export const mainNav = [
  { label: "Features", href: "/features" },
  { label: "Presets", href: "/presets" },
  { label: "Pricing", href: "/pricing" },
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
      { label: "Presets", href: "/presets" },
      { label: "Pricing", href: "/pricing" },
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
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/signup" },
      { label: "Reset password", href: "/forgot-password" },
      { label: "Your account", href: "/account" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Refunds", href: "/legal/refunds" },
    ],
  },
] as const;
