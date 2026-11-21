import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Crosshair,
  Gamepad2,
  Monitor,
  RotateCcw,
  Smartphone,
} from "lucide-react";

export interface Feature {
  slug: string;
  icon: LucideIcon;
  title: string;
  summary: string;
  details: string[];
  limit: string;
}

export const features: Feature[] = [
  {
    slug: "per-monitor-color",
    icon: Monitor,
    title: "Per-monitor color",
    summary:
      "Tune brightness, contrast, saturation, temperature and gamma for each display independently. Your main monitor and your side panel finally stop arguing.",
    details: [
      "Separate profiles keyed to the display identifier, so moving a window between monitors does not drag the wrong look with it.",
      "Fine-grained white balance and per-channel control for panels that leave the factory a little too warm or a little too cold.",
      "Night and day variants that swap on a schedule or on a hotkey you choose.",
    ],
    limit:
      "Applies at the Windows display layer. HDR and OS night-light modes can override parts of the pipeline, and results depend on the panel and its calibration.",
  },
  {
    slug: "game-profiles",
    icon: Gamepad2,
    title: "Game profiles",
    summary:
      "Bind a look to a game executable. Launch the title, get the profile you saved for it — no launcher hooks, no process patching.",
    details: [
      "Match by executable name or by a folder you pick, then attach a color profile and overlay layout.",
      "Switch profiles from a hotkey while a game is running, even in windowed or borderless mode.",
      "Export and import presets as shareable text codes for a second machine.",
    ],
    limit:
      "Matching uses the executable name and path. VYTRIX does not read game memory or inspect the game's rendering state.",
  },
  {
    slug: "crosshair-overlay",
    icon: Crosshair,
    title: "Crosshair overlay",
    summary:
      "A clean reticle drawn in our own transparent window. Shapes, sizes, colors and offsets, with per-game auto-show.",
    details: [
      "Dot, cross, bracket and circle styles with independent gap, thickness and opacity controls.",
      "Center point or custom offset for games that place the aim point away from the screen middle.",
      "Auto-show rules tied to the same game profiles you already use for color.",
    ],
    limit:
      "The overlay is drawn on top of the game; it does not read the game. Some fullscreen-exclusive titles require borderless windowed mode.",
  },
  {
    slug: "reversible-optimizer",
    icon: RotateCcw,
    title: "Reversible optimizer",
    summary:
      "A short list of named Windows performance settings, each with a before snapshot. Change what you want, put it back when you want.",
    details: [
      "Every applied setting is recorded with its original value in a local snapshot.",
      "Apply one tweak or a group, then restore the entire snapshot with a single action.",
      "Plain-language descriptions of what each setting changes and what it may affect.",
    ],
    limit:
      "Settings are scoped to the current user where Windows allows it. Anything requiring elevation is listed before it is applied.",
  },
  {
    slug: "performance-monitor",
    icon: Activity,
    title: "Performance monitor",
    summary:
      "Frame timing and system load in a small overlay, sourced from standard Windows counters and driver telemetry.",
    details: [
      "Frame time, CPU and GPU utilization with configurable refresh rate and smoothing.",
      "Optional compact overlay with just the numbers you care about.",
      "Session logs written locally so you can compare a before and after tweak.",
    ],
    limit:
      "Reads system counters, not game memory. Which counters exist depends on your GPU driver and Windows build.",
  },
  {
    slug: "phone-control",
    icon: Smartphone,
    title: "Phone control",
    summary:
      "A small companion page on your phone for switching profiles and nudging brightness without leaving the couch.",
    details: [
      "Explicit pairing between the desktop app and the phone on the same local network.",
      "Quick profile switching, a brightness slider and a readout of the active display.",
      "No cloud relay and no account on the phone — the session lives on your LAN.",
    ],
    limit:
      "Requires the desktop app to be running and both devices on the same network. Cellular data and remote relay are not supported.",
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const productFaqs: FaqItem[] = [
  {
    question: "Does VYTRIX inject code into games?",
    answer:
      "No. VYTRIX works on the Windows display layer and draws its own overlay window. It does not load a DLL into a game process, hook the game's renderer or patch game files.",
  },
  {
    question: "Will it work with anti-cheat?",
    answer:
      "VYTRIX does not bypass anti-cheat and does not attempt to hide from it. Because it never touches the game process, it does not need to. An anti-cheat may still react to any overlay, so check the rules of the title you play.",
  },
  {
    question: "Which Windows versions are supported?",
    answer:
      "Windows 10 and Windows 11, 64-bit. There is no macOS or Linux build and no browser extension that changes your monitor.",
  },
  {
    question: "Can I use it with more than one monitor?",
    answer:
      "Yes. Profiles are stored per display identifier, so each connected monitor keeps its own color setup. Mixed refresh rates and resolutions are supported.",
  },
  {
    question: "What if I do not like a change?",
    answer:
      "Every optimizer change is recorded with its original value. Restore from the snapshot to put the settings back. Color profiles can be reset to the baseline preset at any time.",
  },
  {
    question: "Does it need a driver or kernel service?",
    answer:
      "No. VYTRIX is a regular user-mode Windows application. It does not install a kernel driver or a system service.",
  },
];

export const accessFaqs: FaqItem[] = [
  {
    question: "Is there a free tier?",
    answer:
      "Yes. Free covers per-monitor color basics, three saved profiles and the community preset gallery. Paid tiers add the optimizer, the full overlay set and phone control.",
  },
  {
    question: "What happens when I cancel a monthly license?",
    answer:
      "Access continues until the end of the paid period. Cancel from the account page once billing is connected; no renewal is charged after that.",
  },
  {
    question: "Is the lifetime license really one payment?",
    answer:
      "It is a one-time payment for the current major version. Major version upgrades are a separate purchase; minor and patch updates are included.",
  },
  {
    question: "Do you accept cryptocurrency?",
    answer:
      "Not at launch. Card checkout is the planned path through Stripe after sign-in. No wallet is requested anywhere on this site.",
  },
  {
    question: "Where do I download the app?",
    answer:
      "The portable Windows x64 executable is on the public GitHub releases page. VYTRIX is open source under MIT; no account, sign-in or license is needed to download it.",
  },
];

export const securityFaqs: FaqItem[] = [
  {
    question: "Does VYTRIX log what I type?",
    answer:
      "No. Global hotkeys are registered as key combinations with the OS. VYTRIX does not capture keystroke content and does not maintain a keylogger.",
  },
  {
    question: "Does it read my game's memory?",
    answer:
      "No. Game profiles match on executable names. Frame timing comes from system counters. Nothing is read out of a game's address space.",
  },
  {
    question: "How are updates delivered?",
    answer:
      "Update manifests and binaries are fetched over HTTPS and verified with a SHA-256 digest before they are applied. The expected digest is published with each release.",
  },
  {
    question: "Is my color data uploaded?",
    answer:
      "No. Profiles, snapshots and logs stay on the device by default. Share codes are text you copy yourself; nothing is uploaded when you export one.",
  },
];

export const allFaqs: FaqItem[] = [...productFaqs, ...accessFaqs, ...securityFaqs];

export interface Tier {
  id: "free" | "monthly" | "lifetime";
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export const tiers: Tier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "no card required",
    description: "The display basics, with no time limit and no account needed to try the app.",
    features: [
      "Per-monitor brightness, contrast and temperature",
      "Three saved profiles",
      "Community preset gallery",
      "Manual hotkey bindings",
      "Reversible color reset",
    ],
    cta: "Sign in to continue",
  },
  {
    id: "monthly",
    name: "Monthly",
    price: "$6",
    cadence: "per month, cancel anytime",
    description: "The whole suite for one month at a time. Best if you are still deciding.",
    features: [
      "Everything in Free",
      "Unlimited profiles and game matching",
      "Reversible performance optimizer",
      "Crosshair and performance overlays",
      "Phone control over the local network",
      "Signed updates for the full suite",
    ],
    cta: "Sign in to continue",
    highlighted: true,
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$79",
    cadence: "one payment, current major version",
    description: "Pay once and keep the current major version, including minor and patch updates.",
    features: [
      "Everything in Monthly",
      "Permanent license for the current major version",
      "Minor and patch updates included",
      "Two additional devices",
      "Priority build channel",
    ],
    cta: "Sign in to continue",
  },
];

export interface Preset {
  name: string;
  code: string;
  kind: string;
  description: string;
  tags: string[];
  accent: "cyan" | "blue" | "purple";
}

export const presets: Preset[] = [
  {
    name: "Neutral Baseline",
    code: "VYTRIX-NEUTRAL-0001",
    kind: "Reference",
    description:
      "A clean starting point with untouched gamma and a daylight white point. Use it when you want to judge a profile against something honest.",
    tags: ["neutral", "reference", "all-round"],
    accent: "cyan",
  },
  {
    name: "Competitive Clarity",
    code: "VYTRIX-CLARITY-2049",
    kind: "Competitive",
    description:
      "Lifted midtones and a cooler white point for reading dark corners without washing out bright surfaces.",
    tags: ["fps", "high contrast", "cool"],
    accent: "blue",
  },
  {
    name: "Night Reader",
    code: "VYTRIX-NIGHT-1174",
    kind: "Comfort",
    description:
      "Lower blue output and reduced peak brightness for long sessions in a dark room. Text stays legible without a glare hit.",
    tags: ["low blue", "evening", "reading"],
    accent: "purple",
  },
  {
    name: "Cinematic Warm",
    code: "VYTRIX-CINE-3310",
    kind: "Media",
    description:
      "A gentle warm shift with preserved shadow detail for film and single-player titles with a deliberate color grade.",
    tags: ["warm", "cinema", "single-player"],
    accent: "purple",
  },
  {
    name: "Studio Neutral 6500K",
    code: "VYTRIX-STUDIO-6500",
    kind: "Reference",
    description:
      "A 6500K target with per-channel trim for panels that drift out of the box. Intended for content work, not for exaggeration.",
    tags: ["6500K", "content", "accurate"],
    accent: "cyan",
  },
  {
    name: "Overcast Grind",
    code: "VYTRIX-OVERCAST-0882",
    kind: "Competitive",
    description:
      "Soft contrast and a flat response for grey, flat maps where crushed blacks hide movement.",
    tags: ["flat", "fog", "tactical"],
    accent: "blue",
  },
];

export interface Release {
  version: string;
  date: string;
  title: string;
  added: string[];
  changed: string[];
  fixed: string[];
}

export const releases: Release[] = [
  {
    version: "0.9.4",
    date: "2026-11-12",
    title: "Snapshot polish and overlay controls",
    added: [
      "Per-setting labels in the optimizer snapshot viewer",
      "Crosshair offset controls for non-centered aim points",
    ],
    changed: [
      "Profile switching no longer flashes the previous color state on multi-monitor setups",
      "The performance overlay now reads GPU counters through the standard provider first",
    ],
    fixed: [
      "A stale display identifier could keep an old profile active after a monitor was unplugged",
      "Hotkey binding dialog accepted a modifier-only combination",
    ],
  },
  {
    version: "0.9.3",
    date: "2026-10-28",
    title: "Phone pairing and share codes",
    added: [
      "Local-network phone control with explicit pairing",
      "Share code export and import for color profiles",
    ],
    changed: [
      "Pairing now expires after 30 days of inactivity",
      "The preset gallery in the app separates official codes from community codes",
    ],
    fixed: [
      "A profile import with a trailing newline was rejected",
      "The companion page lost its connection when the desktop app minimized",
    ],
  },
  {
    version: "0.9.2",
    date: "2026-10-06",
    title: "Reversible optimizer",
    added: [
      "Before snapshots for every applied performance setting",
      "One-click full snapshot restore",
    ],
    changed: [
      "Optimizer entries now show their scope before any elevation prompt",
      "Baseline color profiles are stored locally instead of fetched",
    ],
    fixed: [
      "Restoring a snapshot after a Windows update left one visual effect at its new default",
    ],
  },
  {
    version: "0.9.1",
    date: "2026-09-18",
    title: "Game profiles",
    added: [
      "Executable-name profile matching",
      "Per-game overlay visibility rules",
    ],
    changed: [
      "Profile list sorts by last used game",
      "The tray menu gained a quick profile switcher",
    ],
    fixed: [
      "Two games with the same executable name resolved to the wrong profile",
    ],
  },
  {
    version: "0.9.0",
    date: "2026-09-02",
    title: "First public preview",
    added: [
      "Per-monitor brightness, contrast, saturation and temperature control",
      "Crosshair overlay with four basic shapes",
      "Frame time overlay from system counters",
    ],
    changed: ["Initial Windows 10 and Windows 11 support"],
    fixed: [],
  },
];
