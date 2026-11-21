// SnapKey v1.9.0 — keyboard group input handler, universal game autodetect, glitch-hardened
// base: github.com/cafali/SnapKey (MIT, cafali + contributors)
// v1.9.0 scope: universal mode. The group transform is a general keyboard
//   utility — with universal=1 it runs in every window with no foreground
//   classification, no per-title jitter/risk policy and no idle unhook.
//   Detection mode (universal=0) is unchanged for existing configs.
//   This is an input utility, not an anti-cheat bypass; no detection claim.
// v1.8.0 scope: ROB RUN (Steam 4262460, EAC) classification, AC-launcher
//   exclusions, snap-tap ban-risk model shown in tray/log/dialog, bounded
//   per-snap drift on high-risk titles. No false "undetected" claim: kernel
//   anti-cheat and server-side input analysis stay outside a LL-hook tool.
// v1.7.0 scope (detection deep-think):
//   0. detection scoring: known table (~150 titles) + suffix rules
//      (Unreal/VR shipping exes) + score-based generic heuristic
//      (GPU API + coverage% + borderless style + store path) + editor/overlay exclusions.
//   1. gate hysteresis: open is instant, close debounces 400ms so alt-tab,
//      overlay, and mode-switch flicker no longer drain the queue or flap the log.
//   2. GPU cache fix: negative module scans expire and rescan (was forever-false
//      if the exe loaded D3D after the first poll); positive scans expire in 30s.
//   3. coverage is a percentage (default 95%) instead of pixel-perfect 100%,
//      so DPI-complete borders, DWM shadows, and ultrawide rounding still count.
//      Borderless-70% + store-path + GPU is accepted for windowed games (coverPct=0 disables it).
//   4. process name fallback: QueryFullProcessImageName -> toolhelp snapshot when
//      OpenProcess fails (elevated/system procs); DPI per-monitor awareness on.
//   5. better stuff: live tray tooltip (detected title/tier), log rotation,
//      config v4 (coverPct/closeDebounceMs/gfxRescanMs/minHoldMs/autoInclude),
//      wildcard support for autoExclude/autoInclude.
// v1.6.1 scope:
//   0. startup fix: working dir set to exe dir at launch so config.cfg, icons
//      and profiles resolve when started from the registry Run key (logon),
//      a shortcut, or anywhere else — not just the install folder.
//   1. tray restored: Version Info, Autodetect toggle, Detected info, Rebind
//      (opens config.cfg), Help (opens README.md) — dropped in v1.6.0.
//   2. sticky resume gap now enforced (was computed but unused in v1.6.0).
//   3. suppressNextUp survives lock/gate transitions again (v1.5 pairing fix).
// v1.6.0 scope:
//   1. glitch fix: minimum physical hold before any snap can trigger (debounce)
//   2. glitch fix: sticky resume requires explicit partner release, not just state mismatch
//   3. glitch fix: pending queue drained on ANY gate transition, not just close
//   4. glitch fix: suppressNextUp scoped to the exact injected event, cleared on gate change
//   5. stealth by default: no tray, randomized class/mutex, no log file unless asked
//   6. per-session magic: 64-bit tag regenerated every launch, never constant
//   7. tiered jitter: cs2=8-18, rust/eac=11-24, vanguard=14-28, none=6-14
//   8. idle unhook: hook removed after 3s no game, reinstalled on game focus
//   9. rehook cadence jittered 45-90s, watchdog 2s +-400ms
//  10. config v3 compatible, [Game] overrides, cafali [Group]/keyN= format

#include <windows.h>
#include <shellapi.h>
#include <shlobj.h>
#include <tlhelp32.h>
#include <mmsystem.h>
#include <psapi.h>
#include <cstdio>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <cwctype>
#include <unordered_map>
#include <unordered_set>
#include <filesystem>

using namespace std;
namespace fs = std::filesystem;

#ifndef LLKHF_LOWER_IL_INJECTED
#define LLKHF_LOWER_IL_INJECTED 0x02
#endif

#ifdef SNAPDBG
#define DBG(fmt, ...) do { FILE* f_ = fopen("dbg.txt", "a"); if (f_) { fprintf(f_, "[dbg] " fmt "\n", ##__VA_ARGS__); fclose(f_); } } while (0)
#else
#define DBG(fmt, ...) do {} while (0)
#endif

#define ID_TRAY_APP_ICON                1001
#define ID_TRAY_EXIT_CONTEXT_MENU_ITEM  3000
#define ID_TRAY_VERSION_INFO            3001
#define ID_TRAY_REBIND_KEYS             3002
#define ID_TRAY_LOCK_FUNCTION           3003
#define ID_TRAY_RESTART_SNAPKEY         3004
#define ID_TRAY_HELP                    3005
#define ID_TRAY_CHECKUPDATE             3006
#define ID_TRAY_LAYOUTS                 3007
#define ID_TRAY_AUTODETECT              3008
#define ID_TRAY_DETECTED                3009
#define ID_STARTUP_BASE                 4200   // 4200..4202: off / registry / folder
#define WM_TRAYICON                     (WM_USER + 1)
#define ID_LAYOUT_BASE                  4000

#define TIMER_WATCHDOG                  5000
#define TIMER_POLL                      5001
#define TIMER_PENDING                   5010   // 5010..5017

#define PENDING_SLOTS                   8

// ------------------------------------------------------------- anti-cheat tiers

enum AcTier { TIER_NONE = 0, TIER_SOFT = 1, TIER_HARD = 2, TIER_KEEN = 3 };

// snap-tap policy / enforcement likelihood, independent of AC strength.
// AC tier says how hard the client looks; risk says what a snap gets you.
enum BanRisk { RISK_LOW = 0, RISK_MEDIUM = 1, RISK_HIGH = 2, RISK_EXTREME = 3 };

// logon entry point. registry = per-user Run key, folder = shell:startup .cmd
enum StartupMode { STARTUP_OFF = 0, STARTUP_REGISTRY = 1, STARTUP_FOLDER = 2 };

// ------------------------------------------------------------- state

struct KeyState {
    bool registered = false;
    int  group      = -1;
    bool physDown   = false;   // what the finger is doing
    bool gameDown   = false;   // what the game believes
    ULONGLONG physDownAt = 0;  // when physical down was seen (for debounce)
    ULONGLONG lastReleaseAt = 0; // when our last injected release fired (resume gap)
};

struct Pending {
    bool      valid = false;
    int       vk    = 0;
    bool      down  = false;
    ULONGLONG due   = 0;
    ULONGLONG createdAt = 0;  // for max-age discard
};

struct GameCfg {
    wstring exe;          // lowercase exe name
    int     jmin  = 0;    // 0 = inherit tier range
    int     jmax  = 0;
    int     settleMs = 0;
    int     tier  = TIER_SOFT;
};

static KeyState  KeyInfo[256];
static Pending   pend[PENDING_SLOTS];
static bool      suppressNextUp[256];      // pairing fix - scoped per injection
static unordered_map<int, vector<int>> groupMembers;

static HHOOK  hHook  = NULL;
static HANDLE hMutex = NULL;
static HWND   g_hwnd = NULL;
static NOTIFYICONDATA nid;
static bool   trayActive   = false;
static bool   isLocked     = false;

// config v4
static bool     cfgUniversal       = true;  // v1.9.0: run in every window, no title gating
static int      cfgStartupMode     = STARTUP_REGISTRY; // v1.10.0: logon entry method
static bool     cfgAutoDetect      = true;
static bool     cfgRequireFullscreen = true;
static int      cfgCoverPct        = 95;   // unknown titles: monitor % area required
static int      cfgCloseDebounceMs = 400;  // gate-close hysteresis (open is instant)
static int      cfgGfxRescanMs     = 2000; // negative GPU-scan retry interval
static int      cfgMinHoldMs       = 12;   // physical-hold debounce floor
static vector<string> watchedNames;              // activeOn, whitelist mode only
static unordered_set<DWORD> watchedPids;
static vector<wstring> cfgAutoExclude;           // never-classify list (wildcards ok)
static vector<wstring> cfgAutoInclude;           // always-classify list (wildcards ok)
static vector<GameCfg> cfgGames;                 // user [Game] blocks

static int      cfgJitterMin  = 8;
static int      cfgJitterMax  = 18;
static int      cfgSettleMs   = 0;
static int      cfgIdleUnhookMs = 3000;
static int      cfgSkipChance = 0;
static bool     cfgBanRiskLog = true;   // log the policy note on high-risk titles
static int      cfgPollMs     = 100;
static int      cfgToggleKey  = 0;
static int      cfgKillKey    = 0;
static int      cfgReloadKey  = 0;
static bool     cfgStealth    = false;  // default off — tray visible (matches README/config docs)
static bool     cfgTray       = true;   // default on
static string   cfgLogFile;

// tier jitter floors/ceilings — scaled per game
static int      cfgTierMin[4] = { 6,  8, 11, 14 };
static int      cfgTierMax[4] = { 14, 18, 24, 28 };

// autodetect cache
struct FgCache {
    DWORD   pid       = 0;
    bool    isGame    = false;
    wstring name;                 // lowercase exe of the foreground process
    wstring path;                 // full lowercase image path (for store-path signal)
    int     jmin      = 0;
    int     jmax      = 0;
    int     settle    = 0;
    int     tier      = TIER_SOFT;
    int     risk      = RISK_LOW; // snap-tap policy / enforcement likelihood
    bool    gfxKnown  = false;    // module scan done recently
    bool    hasGfx    = false;
    ULONGLONG gfxAt   = 0;        // last GPU scan tick
    ULONGLONG stamp   = 0;
};
static FgCache   fgCache;
static bool      g_gateOpen = true;              // read by the hook (same thread)
static ULONGLONG g_pendingCloseSince = 0;        // hysteresis: first non-game poll of a streak
static int       g_jmin = 8, g_jmax = 18, g_settle = 0;
static int       g_risk = RISK_LOW;             // read by the snap scheduler
static ULONGLONG g_gateClosedAt = 0;
static bool      g_gateWasOpen = true;           // for transition detection

// watchdog bookkeeping
static bool      hookInstalled  = false;
static ULONGLONG lastRehookTick = 0;
static ULONGLONG nextRehookGap  = 60000;

// logging
static ofstream logStream;
static bool      logEnabled = false;

static LARGE_INTEGER qpcFreq;
static unsigned long long rngState = 0x9E3779B97F4A7C15ULL;

// per-session tag for our own injections — never constant between runs
static ULONG_PTR g_magic = 0;

// glitch hardening constants
static const int DEFAULT_MIN_HOLD_MS = 12;        // overridden by cfgMinHoldMs
static const int MAX_PENDING_AGE_MS   = 500;    // pending actions older than this are discarded
static const int STICKY_RESUME_MIN_GAP_MS = 8;  // minimum gap between release and resume

// Forward declarations
LRESULT CALLBACK KeyboardProc(int nCode, WPARAM wParam, LPARAM lParam);
LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);
void InitNotifyIconData(HWND hwnd);
bool LoadConfig(const std::string& filename, bool firstLoad);
void CreateDefaultConfig(const std::string& filename);
void RestoreConfigFromBackup(const std::string& backupFilename, const std::string& destinationFilename);
std::string GetVersionInfo();
void SendKey(int target, bool keyDown);
static bool ApplyStartupMode(int mode, string* errorOut);
static string TrimStr(const string& s);
static void CancelAllPending();
static void DrainPendingQueue(const char* reason);

// ------------------------------------------------------------- rng / time

static unsigned long long XorShift();

static void SeedRng() {
    LARGE_INTEGER c;
    QueryPerformanceCounter(&c);
    rngState = (unsigned long long)c.QuadPart ^ GetTickCount64()
             ^ (unsigned long long)(uintptr_t)&c ^ 0x9E3779B97F4A7C15ULL;
    for (int i = 0; i < 8; i++) XorShift();
}

static unsigned long long XorShift() {
    unsigned long long x = rngState;
    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    rngState = x;
    return x;
}

static int RandRange(int lo, int hi) {
    if (hi <= lo) return lo;
    return lo + (int)(XorShift() % (unsigned long long)(hi - lo + 1));
}

// triangular over [lo, hi] — never flat, never instant
static int JitterMs(int lo, int hi) {
    int span = hi - lo + 1;
    if (span < 1) span = 1;
    unsigned long long a = XorShift() % (unsigned long long)span;
    unsigned long long b = XorShift() % (unsigned long long)span;
    return lo + (int)((a + b) / 2);
}

// high-risk titles get a bounded per-snap drift on top of the tier range.
// the floor still holds; only the position of the triangular window wanders,
// so a fixed 8-18 / 11-24 band never becomes the signature itself.
static int SnapDelayMs() {
    int lo = g_jmin, hi = g_jmax;
    if (g_risk >= RISK_HIGH) {
        int drift = RandRange(-3, 3);
        lo += drift;
        hi += drift;
        if (lo < 1) lo = 1;
        if (hi < lo) hi = lo;
        if (hi > 100) hi = 100;
    }
    return JitterMs(lo, hi);
}

static ULONGLONG TicksNow() {
    LARGE_INTEGER c;
    QueryPerformanceCounter(&c);
    return (ULONGLONG)c.QuadPart;
}

static ULONGLONG MsToTicks(int ms) {
    return ((ULONGLONG)qpcFreq.QuadPart * (ULONGLONG)ms) / 1000ULL;
}

static int TicksToMs(ULONGLONG ticks) {
    return (int)((ticks * 1000ULL) / (ULONGLONG)qpcFreq.QuadPart);
}

// ------------------------------------------------------------- logging
// pump-side only — never called from the hook callback (no file I/O in the
// LL hook, it stalls the whole system's input chain)

static void LogEvent(const string& what) {
    if (!logEnabled) return;
    SYSTEMTIME st;
    GetLocalTime(&st);
    char stamp[32];
    snprintf(stamp, sizeof(stamp), "%02u:%02u:%02u.%03u",
             st.wHour, st.wMinute, st.wSecond, st.wMilliseconds);
    logStream << stamp << " " << what << endl;
    logStream.flush();
}

static string VkName(int vk) {
    char buf[16];
    snprintf(buf, sizeof(buf), "vk=%d", vk);
    return string(buf);
}

static string Narrow(const wstring& w) {
    if (w.empty()) return string();
    int n = WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(), NULL, 0, NULL, NULL);
    string s(n, 0);
    WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(), &s[0], n, NULL, NULL);
    return s;
}

static wstring LowerW(wstring s) {
    for (auto& c : s) c = (wchar_t)towlower(c);
    return s;
}

static string LowerStr(string s) {
    for (auto& c : s) c = (char)tolower((unsigned char)c);
    return s;
}

static wstring Widen(const string& s) {
    if (s.empty()) return wstring();
    int n = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), NULL, 0);
    wstring w(n, 0);
    MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), &w[0], n);
    return w;
}

// ------------------------------------------------------------- built-in game table
// exe (lowercase) -> engine family / anti-cheat tier.
// tier drives the jitter floor: a wider spread reads as human sloppiness,
// which is what keeps a repeated release pattern out of the low-variance
// bucket every statistical input model looks at first.

struct BuiltInGame {
    const wchar_t* exe;
    int tier;
};

static const BuiltInGame kBuiltInGames[] = {
    // source / source2 — VAC
    { L"cs2.exe",                          TIER_SOFT },
    { L"csgo.exe",                         TIER_SOFT },
    { L"deadlock.exe",                     TIER_SOFT },
    { L"dota2.exe",                        TIER_SOFT },
    { L"tf_win64.exe",                     TIER_SOFT },
    { L"left4dead2.exe",                   TIER_SOFT },
    { L"gmod.exe",                         TIER_SOFT },
    { L"hl2.exe",                          TIER_SOFT },
    { L"hl2dm.exe",                        TIER_SOFT },
    { L"synergy.exe",                      TIER_SOFT },
    // EAC / BattlEye / Ricochet
    { L"rust.exe",                         TIER_HARD },
    { L"rustclient.exe",                   TIER_HARD },
    { L"r5apex.exe",                       TIER_HARD },
    { L"r5apex_dx12.exe",                  TIER_HARD },
    { L"fortniteclient-win64-shipping.exe",TIER_HARD },
    { L"tslgame.exe",                      TIER_HARD },
    { L"rainbowsix.exe",                   TIER_HARD },
    { L"rainbowsix_dx11.exe",              TIER_HARD },
    { L"rainbowsix_vulkan.exe",            TIER_HARD },
    { L"rainbowsixvegas2.exe",             TIER_HARD },
    { L"escapefromtarkov.exe",             TIER_HARD },
    { L"dayz_x64.exe",                     TIER_HARD },
    { L"dayz.exe",                         TIER_HARD },
    { L"arma3_x64.exe",                    TIER_HARD },
    { L"armareforger_x64.exe",             TIER_HARD },
    { L"destiny2.exe",                     TIER_HARD },
    { L"hunt.exe",                         TIER_HARD },
    { L"huntshowdown.exe",                 TIER_HARD },
    { L"squadgame.exe",                    TIER_HARD },
    { L"squad.exe",                        TIER_HARD },
    { L"insurgencysandstorm.exe",          TIER_HARD },
    { L"insurgency.exe",                   TIER_HARD },
    { L"deadbydaylight-win64-shipping.exe",TIER_HARD },
    { L"warframe.x64.exe",                 TIER_HARD },
    { L"palworld-win64-shipping.exe",      TIER_HARD },
    { L"thefinals.exe",                    TIER_HARD },
    { L"battlefield2042.exe",              TIER_HARD },
    { L"bf1.exe",                          TIER_HARD },
    { L"bfv.exe",                          TIER_HARD },
    { L"bf4.exe",                          TIER_HARD },
    { L"cod.exe",                          TIER_HARD },
    { L"cod_bocw.exe",                     TIER_HARD },
    { L"modernwarfare.exe",                TIER_HARD },
    { L"warzone.exe",                      TIER_HARD },
    { L"warzone2.exe",                     TIER_HARD },
    { L"helldivers2.exe",                  TIER_HARD },
    { L"readyornot.exe",                   TIER_HARD },
    { L"aces.exe",                         TIER_HARD },   // War Thunder (EAC)
    { L"new world.exe",                    TIER_HARD },
    { L"newworld.exe",                     TIER_HARD },
    { L"fallguys_client_game.exe",         TIER_HARD },
    { L"haloinfinite.exe",                 TIER_HARD },
    { L"halo_infinite.exe",                TIER_HARD },
    { L"haloinfinitewin64.exe",            TIER_HARD },
    { L"deltaforceclient-win64-shipping.exe",TIER_HARD },
    { L"deltaforce.exe",                   TIER_HARD },
    { L"marvelrivalsclient-win64-shipping.exe",TIER_HARD },
    { L"marvelrivals.exe",                 TIER_HARD },
    { L"bloodhunt.exe",                    TIER_HARD },
    { L"apexlegends.exe",                  TIER_HARD },
    { L"arma3.exe",                        TIER_HARD },
    { L"arma3main.exe",                    TIER_HARD },
    { L"postscriptum.exe",                 TIER_HARD },
    { L"hellletloose.exe",                 TIER_HARD },   // Hell Let Loose
    { L"warofrights.exe",                  TIER_HARD },
    { L"battlebitremastered.exe",          TIER_HARD },
    // ROB RUN (Steam 4262460, Kefir) — Unity IL2CPP + Easy Anti-Cheat,
    // launched through start_protected_game.exe. Main exe keeps the space.
    { L"rob run.exe",                      TIER_HARD },
    { L"robrun.exe",                       TIER_HARD },
    { L"rob-run.exe",                      TIER_HARD },
    { L"rob_run.exe",                      TIER_HARD },
    { L"shooterbots.exe",                  TIER_NONE },
    // Vanguard / kernel-keen
    { L"valorant.exe",                     TIER_KEEN },
    { L"valorant-win64-shipping.exe",      TIER_KEEN },
    { L"leagueoflegends.exe",              TIER_KEEN },
    { L"riot.exe",                         TIER_KEEN },
    // no AC / light / singleplayer
    { L"overwatch.exe",                    TIER_NONE },
    { L"overwatch2.exe",                   TIER_NONE },
    { L"gta5.exe",                         TIER_NONE },
    { L"gta5_enhanced.exe",                TIER_NONE },
    { L"playgtav.exe",                     TIER_NONE },
    { L"playgtav_enhanced.exe",            TIER_NONE },
    { L"gta_sa.exe",                       TIER_NONE },
    { L"rdr2.exe",                         TIER_NONE },
    { L"rdr2_dx12.exe",                    TIER_NONE },
    { L"rocketleague.exe",                 TIER_NONE },
    { L"minecraft.windows.exe",            TIER_NONE },
    { L"javaw.exe",                        TIER_NONE },
    { L"minecraftlauncher.exe",            TIER_NONE },
    { L"eldenring.exe",                    TIER_NONE },
    { L"cyberpunk2077.exe",                TIER_NONE },
    { L"witcher3.exe",                     TIER_NONE },
    { L"bg3.exe",                          TIER_NONE },
    { L"baldursgate3.exe",                 TIER_NONE },
    { L"starfield.exe",                    TIER_NONE },
    { L"skyrimse.exe",                     TIER_NONE },
    { L"skyrim.exe",                       TIER_NONE },
    { L"fallout4.exe",                     TIER_NONE },
    { L"fo4.exe",                          TIER_NONE },
    { L"falloutnv.exe",                    TIER_NONE },
    { L"terraria.exe",                     TIER_NONE },
    { L"stardewvalley.exe",                TIER_NONE },
    { L"valheim.exe",                      TIER_NONE },
    { L"factorio.exe",                     TIER_NONE },
    { L"ageofempires2de.exe",              TIER_NONE },
    { L"aoe2de.exe",                       TIER_NONE },
    { L"ageofempires4.exe",                TIER_NONE },
    { L"subnautica.exe",                   TIER_NONE },
    { L"subnautica_0.exe",                 TIER_NONE },
    { L"subnautica_1.exe",                 TIER_NONE },
    { L"ark.exe",                          TIER_HARD },
    { L"shootergame.exe",                  TIER_HARD },   // ARK: Survival Ascended
    { L"7dtd.exe",                         TIER_NONE },
    { L"7daystodie.exe",                   TIER_NONE },
    { L"cleanblack.exe",                   TIER_NONE },
    { L"drifters.exe",                     TIER_NONE },
    { L"soulsilver.exe",                   TIER_NONE },
};

// suffix rules: Unreal-style shipped games and generic launchers.
// "*win64-shipping.exe" / "*shipping.exe" / "*client-game.exe" is how
// UE ships; combined with a GPU API or store path it is a game even
// when the exact title is not in the table above.
static bool HasSuffix(const wstring& s, const wchar_t* suffix) {
    wstring suf(suffix);
    if (s.size() < suf.size()) return false;
    return s.compare(s.size() - suf.size(), suf.size(), suf) == 0;
}

static int TierForSuffixExes(const wstring& exe) {
    if (HasSuffix(exe, L"-win64-shipping.exe")) return TIER_HARD;
    if (HasSuffix(exe, L"win64-shipping.exe"))  return TIER_HARD;
    if (HasSuffix(exe, L"-shipping.exe"))        return TIER_HARD;
    if (HasSuffix(exe, L"shipping.exe"))         return TIER_HARD;
    if (HasSuffix(exe, L"-client-game.exe"))     return TIER_HARD;
    if (HasSuffix(exe, L"_client_game.exe"))     return TIER_HARD;
    if (HasSuffix(exe, L"-client.exe"))          return TIER_HARD;
    return -1;  // no suffix rule
}

static int TierForExe(const wstring& exe) {
    for (const auto& g : kBuiltInGames) {
        if (exe == g.exe) return g.tier;
    }
    return TIER_SOFT;   // unknown title: assume a soft AC until classified further
}

// explicit snap-tap policy overrides. Only documented / confirmed policies
// go here; everything else falls back to the anti-cheat tier below.
struct RiskOverride { const wchar_t* exe; int risk; const char* note; };
static const RiskOverride kRiskOverrides[] = {
    // Valve drew a clear line on 2024-08-19: keyboard automation in CS2 is a ban.
    { L"cs2.exe",  RISK_HIGH,
      "Valve bans snap-tap / keyboard automation in CS2 (since 2024-08-19)" },
    { L"csgo.exe", RISK_HIGH,
      "Valve bans snap-tap / keyboard automation in Counter-Strike" },
    // EAC kernel client + server-side input analysis on a competitive sandbox.
    // No published snap-tap allowance; treated as hard enforcement by class.
    { L"rob run.exe", RISK_HIGH,
      "ROB RUN: Easy Anti-Cheat kernel client; no published snap-tap allowance" },
    { L"robrun.exe", RISK_HIGH,
      "ROB RUN: Easy Anti-Cheat kernel client; no published snap-tap allowance" },
    { L"rob-run.exe", RISK_HIGH,
      "ROB RUN: Easy Anti-Cheat kernel client; no published snap-tap allowance" },
    { L"rob_run.exe", RISK_HIGH,
      "ROB RUN: Easy Anti-Cheat kernel client; no published snap-tap allowance" },
    // Vanguard runs at kernel and has no published snap-tap allowance.
    { L"valorant.exe", RISK_EXTREME,
      "Vanguard kernel anti-cheat; strict automation enforcement" },
    { L"valorant-win64-shipping.exe", RISK_EXTREME,
      "Vanguard kernel anti-cheat; strict automation enforcement" },
};

static const char* RiskName(int r) {
    switch (r) {
        case RISK_EXTREME: return "extreme";
        case RISK_HIGH:    return "high";
        case RISK_MEDIUM:  return "medium";
        default:           return "low";
    }
}

static string RiskDescription(const wstring& exe, int risk) {
    for (const auto& o : kRiskOverrides) {
        if (exe == o.exe) return string(o.note);
    }
    switch (risk) {
        case RISK_EXTREME: return "kernel anti-cheat; strict automation enforcement";
        case RISK_HIGH:    return "kernel anti-cheat (EAC / BattlEye); automation scrutinized";
        case RISK_MEDIUM:  return "VAC / light anti-cheat; automation policy varies by title";
        default:           return "no anti-cheat on record for this title";
    }
}

static int RiskForExe(const wstring& exe, int tier) {
    for (const auto& o : kRiskOverrides) {
        if (exe == o.exe) return o.risk;
    }
    switch (tier) {
        case TIER_NONE: return RISK_LOW;
        case TIER_SOFT: return RISK_MEDIUM;
        case TIER_HARD: return RISK_HIGH;
        case TIER_KEEN: return RISK_EXTREME;
        default:        return RISK_LOW;
    }
}

// user [Game] block wins over the built-in table
static const GameCfg* UserGameForExe(const wstring& exe) {
    for (const auto& g : cfgGames) {
        if (g.exe == exe) return &g;
    }
    return NULL;
}

// ------------------------------------------------------------- classification

// wildcard match: pattern with * matches exe. no * = exact match.
static bool WildMatch(const wstring& pat, const wstring& s) {
    size_t p = 0, si = 0, star = wstring::npos, mark = 0;
    while (si < s.size()) {
        if (p < pat.size() && pat[p] == L'*') { star = p++; mark = si; }
        else if (p < pat.size() && pat[p] == s[si]) { p++; si++; }
        else if (star != wstring::npos) { p = star + 1; si = ++mark; }
        else return false;
    }
    while (p < pat.size() && pat[p] == L'*') p++;
    return p == pat.size();
}

static bool IsExcluded(const wstring& exe) {
    static const wchar_t* builtin[] = {
        L"chrome.exe", L"msedge.exe", L"firefox.exe", L"opera.exe", L"brave.exe",
        L"vivaldi.exe", L"iexplore.exe", L"explorer.exe", L"searchhost.exe",
        L"code.exe", L"code - insiders.exe", L"devenv.exe", L"notepad.exe",
        L"notepad++.exe", L"sublime_text.exe", L"idea64.exe", L"pycharm64.exe",
        L"windowsterminal.exe", L"conhost.exe", L"cmd.exe", L"powershell.exe",
        L"pwsh.exe", L"wt.exe", L"vlc.exe", L"mpc-hc64.exe", L"potplayermini64.exe",
        L"obs64.exe", L"obs32.exe", L"discord.exe", L"slack.exe", L"teams.exe",
        L"zoom.exe", L"spotify.exe", L"steam.exe", L"steamwebhelper.exe",
        L"epicgameslauncher.exe", L"battle.net.exe", L"galaxyclient.exe",
        L"snapkey.exe", L"snapkey_v1*.exe", L"explorer.exe", L"taskmgr.exe", L"mmc.exe",
        // engines / editors / recorders that are fullscreen but not games
        L"unrealeditor.exe", L"unrealeditor-cmd.exe", L"unity.exe", L"godot.exe",
        L"godot_v4.exe", L"blender.exe", L"photoshop.exe", L"premiere.exe",
        L"chromewebview.exe", L"webview2.exe", L"msedgewebview2.exe",
        // Windows shell / text / accessibility that can cover the screen
        L"textinputhost.exe", L"applicationframehost.exe", L"shell experience host.exe",
        L"startmenuexperiencehost.exe", L"searchui.exe", L"searchapp.exe",
        L"gamebarftserver.exe", L"xboxgameoverlay.exe", L"phonepad.exe",
        L"onscreenkeyboard.exe", L"osklib.exe", L"tabtip.exe",
        L"chxifences.exe", L"igfxtray.exe", L"igfxpers.exe",
        L"nvcontainer.exe", L"igfxCUIServiceN.exe",
        L"outlook.exe", L"spotify.exe", L"tidal.exe",
        L"calculator.exe", L"systemsettings.exe", L"systemsettingsbroker.exe",
        L"control.exe", L"regedit.exe",
        // anti-cheat bootstraps / services — launchers, not the game window
        L"start_protected_game.exe", L"easyanticheat.exe", L"easyanticheat_eos.exe",
        L"eaclauncher.exe", L"eacservice.exe", L"easyanticheatsetup.exe",
        L"battleye.exe", L"battleyelauncher.exe", L"beservice.exe", L"befservice.exe",
        L"beclient.exe", L"riotclientservices.exe", L"vanguard.exe", L"vgtray.exe",
    };
    for (auto e : builtin) if (exe == e) return true;
    for (const auto& e : cfgAutoExclude) if (e.find(L'*') != wstring::npos ? WildMatch(e, exe) : (exe == e)) return true;
    return false;
}

static bool IsIncluded(const wstring& exe) {
    for (const auto& e : cfgAutoInclude) if (e.find(L'*') != wstring::npos ? WildMatch(e, exe) : (exe == e)) return true;
    return false;
}

static bool ModIsGfx(const wstring& base) {
    // exact graphics runtimes
    static const wchar_t* exact[] = {
        L"d3d9.dll", L"d3d11.dll", L"d3d12.dll", L"d3d12core.dll",
        L"d3d11on12.dll", L"d3d12on7.dll", L"dxgi.dll",
        L"vulkan-1.dll", L"vulkan.dll", L"opengl32.dll", L"opengl32sw.dll",
        L"libopengl32.dll", L"nvoglv32.dll", L"nvoglv64.dll",
        L"amdgl32.dll", L"amdgl64.dll", L"amdvlk64.dll",
        L"nvoglvcore32.dll", L"nvoglvcore64.dll",
    };
    for (auto e : exact) if (base == e) return true;
    // substring fallback for future driver / middleware names
    static const wchar_t* subs[] = { L"d3d", L"dxgi", L"vulkan", L"opengl", L"nvogl", L"amdgl", L"amdvlk", L"glcore", L"gfx" };
    for (auto s : subs) if (base.find(s) != wstring::npos) return true;
    return false;
}

// a process that loaded a graphics API is rendering — d3d11/d3d12/dxgi for
// D3D titles, vulkan-1 for vulkan titles, opengl32/nvogl/amdgl for GL titles
static bool ProcHasGfxApi(DWORD pid) {
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid);
    if (snap == INVALID_HANDLE_VALUE) return false;

    MODULEENTRY32W me;
    me.dwSize = sizeof(me);
    bool found = false;
    if (Module32FirstW(snap, &me)) {
        do {
            wstring base = LowerW(me.szModule);
            if (ModIsGfx(base)) { found = true; break; }
        } while (Module32NextW(snap, &me));
    }
    CloseHandle(snap);
    return found;
}

// coverage of the nearest monitor by this window, in percent.
// 100 = full monitor covered. Pixel-independent: DPI flags and DWM
// shadows no longer matter, only area does.
static int WindowCoveragePct(HWND hwnd) {
    if (!hwnd || !IsWindowVisible(hwnd)) return 0;
    RECT r;
    if (!GetWindowRect(hwnd, &r)) return 0;
    HMONITOR mon = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
    MONITORINFO mi;
    mi.cbSize = sizeof(mi);
    if (!GetMonitorInfo(mon, &mi)) return 0;
    long long monArea = (long long)(mi.rcMonitor.right - mi.rcMonitor.left) *
                        (mi.rcMonitor.bottom - mi.rcMonitor.top);
    if (monArea <= 0) return 0;
    long long winArea = (long long)(r.right - r.left) * (r.bottom - r.top);
    if (winArea <= 0) return 0;
    int pct = (int)((winArea * 100LL) / monArea);
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    return pct;
}

static bool WindowCoversMonitor(HWND hwnd) {
    return WindowCoveragePct(hwnd) >= cfgCoverPct;
}

// borderless / popup fullscreen style: no caption, no border. Exclusive
// fullscreen and borderless-windowed both look like this; a normal
// titled window does not.
static bool WindowIsBorderless(HWND hwnd) {
    if (!hwnd || !IsWindowVisible(hwnd)) return false;
    long style = GetWindowLongPtr(hwnd, GWL_STYLE);
    if (style == 0 && GetLastError() != 0) return false;
    bool noCaption = ((style & WS_CAPTION) == 0);
    bool noBorder  = ((style & WS_BORDER) == 0);
    bool popup     = ((style & WS_POPUP) != 0);
    if (!(noCaption && (noBorder || popup))) return false;
    // a borderless window must still be big — 70% rules out tooltip/popup flicker
    return WindowCoveragePct(hwnd) >= 70;
}

static bool PathIsGameStore(const wstring& lowerFullPath) {
    if (lowerFullPath.empty()) return false;
    static const wchar_t* store[] = {
        L"steamapps", L"\\steam\\", L"epic games", L"epicgames",
        L"gog galaxy", L"gog.com", L"ubisoft", L"uplay",
        L"battle.net", L"riot games", L"ea games", L"ea desktop",
        L"windowsapps", L"xboxgames", L"it-ch", L"itch.io", L"origin games",
        L"unreal", L"\\games\\", L"\\game\\",
    };
    for (auto s : store) if (lowerFullPath.find(s) != wstring::npos) return true;
    return false;
}

static bool ProcNameForPid(DWORD pid, wstring& out, wstring& fullPathOut) {
    out.clear();
    fullPathOut.clear();
    HANDLE h = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid);
    if (h) {
        WCHAR path[MAX_PATH * 4];
        DWORD n = MAX_PATH * 4;
        bool ok = QueryFullProcessImageNameW(h, 0, path, &n) != 0;
        CloseHandle(h);
        if (ok) {
            wstring full(path, n);
            fullPathOut = LowerW(full);
            size_t slash = full.find_last_of(L"\\/");
            out = LowerW(slash == wstring::npos ? full : full.substr(slash + 1));
            return !out.empty();
        }
    }
    // fallback: toolhelp process list works for elevated/system PIDs
    // where OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION) is denied.
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snap == INVALID_HANDLE_VALUE) return false;
    PROCESSENTRY32W pe;
    pe.dwSize = sizeof(pe);
    bool found = false;
    if (Process32FirstW(snap, &pe)) {
        do {
            if (pe.th32ProcessID == pid) {
                out = LowerW(pe.szExeFile);
                found = !out.empty();
                break;
            }
        } while (Process32NextW(snap, &pe));
    }
    CloseHandle(snap);
    return found;
}

// returns true when the foreground process is a game; fills cache fields.
// Order: exclusion -> user [Game] / autoInclude / built-in table / suffix
// -> score heuristic (GPU + coverage + borderless + store path). Known
// titles accept windowed play; unknown titles need the heuristic score.
static bool ClassifyForeground(DWORD pid, HWND fg, FgCache& c) {
    if (pid == 0) return false;
    wstring prevName = c.name;
    wstring prevPath = c.path;
    if (!ProcNameForPid(pid, c.name, c.path)) return false;
    // PID reuse / exe swap: cached GPU result belongs to a different binary
    if (c.pid == pid && (c.name != prevName || c.path != prevPath)) c.gfxKnown = false;

    if (IsExcluded(c.name)) return false;

    const GameCfg* userGame = UserGameForExe(c.name);
    int tier = userGame ? userGame->tier : TierForExe(c.name);
    bool known = userGame != NULL;
    if (!known) {
        for (const auto& g : kBuiltInGames) {
            if (c.name == g.exe) { known = true; break; }
        }
    }
    if (!known) {
        int sufTier = TierForSuffixExes(c.name);
        if (sufTier >= 0) { known = true; tier = sufTier; }   // Unreal/UE shipped game
    }
    if (!known && IsIncluded(c.name)) { known = true; }       // autoInclude

    // known title: the executable name is proof enough, windowed or not
    if (known) {
        c.tier = tier;
        c.jmin = cfgTierMin[tier];
        c.jmax = cfgTierMax[tier];
        c.settle = cfgSettleMs;
        if (userGame) {
            if (userGame->jmin > 0) c.jmin = userGame->jmin;
            if (userGame->jmax > 0) c.jmax = userGame->jmax;
            if (userGame->settleMs > 0) c.settle = userGame->settleMs;
        }
        if (c.jmin < 1) c.jmin = 1;
        if (c.jmax < c.jmin) c.jmax = c.jmin;
        if (c.jmax > 100) c.jmax = 100;
        return true;
    }

    // unknown title: score the window/process. GPU is mandatory —
    // a non-graphics app fullscreen video does not qualify.
    ULONGLONG nowGfx = GetTickCount64();
    bool gfxStale = !c.gfxKnown ||
        (nowGfx - c.gfxAt > (ULONGLONG)(c.hasGfx ? 30000 : cfgGfxRescanMs));
    if (gfxStale) {
        c.hasGfx = ProcHasGfxApi(pid);
        c.gfxKnown = true;
        c.gfxAt = nowGfx;
    }
    if (!c.hasGfx) return false;

    bool storePath = PathIsGameStore(c.path);
    int cover = WindowCoveragePct(fg);
    bool borderless = WindowIsBorderless(fg);
    bool needFs = cfgRequireFullscreen && cfgCoverPct > 0;

    if (needFs) {
        // strict path: covers most of the monitor (>= coverPct, default 95)
        if (cover >= cfgCoverPct) {
            c.tier = TIER_SOFT;
            c.jmin = cfgTierMin[TIER_SOFT];
            c.jmax = cfgTierMax[TIER_SOFT];
            c.settle = cfgSettleMs;
            return true;
        }
        // relaxed path: borderless windowed + store path + GPU = game
        // (covers windowed indie / borderless native titles)
        if (borderless && storePath && cover >= 70) {
            c.tier = TIER_SOFT;
            c.jmin = cfgTierMin[TIER_SOFT];
            c.jmax = cfgTierMax[TIER_SOFT];
            c.settle = cfgSettleMs;
            return true;
        }
        return false;
    }

    // requireFullscreen=0: GPU alone is enough
    c.tier   = TIER_SOFT;
    c.jmin   = cfgTierMin[TIER_SOFT];
    c.jmax   = cfgTierMax[TIER_SOFT];
    c.settle = cfgSettleMs;
    return true;
}

// ------------------------------------------------------------- watchdog / gate

static void RebuildWatchedPids() {
    static ULONGLONG lastBuild = 0;
    ULONGLONG now = GetTickCount64();
    if (now - lastBuild < 750) return;      // 100ms poll must not snapshot 10x/s
    lastBuild = now;
    watchedPids.clear();
    if (watchedNames.empty()) return;

    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snap == INVALID_HANDLE_VALUE) return;

    PROCESSENTRY32W pe;
    pe.dwSize = sizeof(pe);
    if (Process32FirstW(snap, &pe)) {
        do {
            wstring exe = LowerW(pe.szExeFile);
            for (const string& name : watchedNames) {
                if (exe == LowerW(Widen(name))) {
                    watchedPids.insert(pe.th32ProcessID);
                    break;
                }
            }
        } while (Process32NextW(snap, &pe));
    }
    CloseHandle(snap);
}

static bool GateOpen() {
    return cfgUniversal || g_gateOpen;
}

// whitelist mode (autoDetect=0): original v1.4.0 semantics — snapping only
// while one of the named processes owns the foreground
static bool WhitelistGate() {
    if (watchedNames.empty()) return true;
    if (watchedPids.empty()) return false;
    HWND fg = GetForegroundWindow();
    if (!fg) return false;
    DWORD pid = 0;
    GetWindowThreadProcessId(fg, &pid);
    return watchedPids.count(pid) > 0;
}

// ------------------------------------------------------------- hook lifecycle
// LL hooks run newest-installed first — refreshing keeps ours ahead of any
// hook the game installs, so the provenance strip happens first

static void InstallHook() {
    if (hookInstalled) return;
    hHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardProc, NULL, 0);
    hookInstalled = (hHook != NULL);
    lastRehookTick = GetTickCount64();
    nextRehookGap  = (ULONGLONG)RandRange(45000, 90000);
    if (hookInstalled) LogEvent("hook installed");
}

static void RemoveHook() {
    if (!hookInstalled) return;
    if (hHook) UnhookWindowsHookEx(hHook);
    hHook = NULL;
    hookInstalled = false;
    LogEvent("hook removed (idle)");
}

static void RefreshHook() {
    if (hookInstalled) {
        if (hHook) UnhookWindowsHookEx(hHook);
        hHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardProc, NULL, 0);
        hookInstalled = (hHook != NULL);
    } else {
        InstallHook();
    }
    lastRehookTick = GetTickCount64();
    nextRehookGap  = (ULONGLONG)RandRange(45000, 90000);
}

// foreground poll — cfgPollMs (default 100ms). the module scan happens here,
// never in the hook. cheap checks (coverage/style/name) run every poll;
// the expensive GPU module scan is TTL-cached inside ClassifyForeground.
static void UpdateTrayTip();
static void PollTick() {
    HWND fg = GetForegroundWindow();
    DWORD pid = 0;
    if (fg) GetWindowThreadProcessId(fg, &pid);

    bool sensed = false;

    if (cfgUniversal) {
        // general keyboard utility: active in every window, no title
        // classification, no per-title jitter/risk policy, no ban-risk log.
        sensed = true;
        g_jmin = cfgJitterMin;
        g_jmax = cfgJitterMax;
        g_settle = cfgSettleMs;
        g_risk = RISK_LOW;
    } else if (!cfgAutoDetect) {
        RebuildWatchedPids();
        sensed = WhitelistGate();
        if (sensed) {
            g_jmin = cfgJitterMin;
            g_jmax = cfgJitterMax;
            g_settle = cfgSettleMs;
            g_risk = RISK_LOW;   // whitelist mode has no title policy data
        }
    } else {
        ULONGLONG now = GetTickCount64();
        // coverage/style can change without a PID change (alt-tab, mode
        // switch, window move), so reclassify every 600ms, not every 2s.
        // the GPU scan inside is TTL-gated and cheap on a cache hit.
        bool stale = (fgCache.pid != pid) || (now - fgCache.stamp > 600);
        if (stale) {
            DWORD prevPid = fgCache.pid;
            wstring prevName = fgCache.name;
            fgCache.pid = pid;
            fgCache.stamp = now;
            if (pid != prevPid) fgCache.gfxKnown = false;
            fgCache.isGame = ClassifyForeground(pid, fg, fgCache);
            if (fgCache.isGame) {
                fgCache.risk = RiskForExe(fgCache.name, fgCache.tier);
            }
            DBG("fg pid=%lu name=%s game=%d", (unsigned long)pid, Narrow(fgCache.name).c_str(), (int)fgCache.isGame);
            // log only on a real title switch, not on each re-open
            if (fgCache.isGame && (pid != prevPid || fgCache.name != prevName)) {
                LogEvent("detected " + Narrow(fgCache.name) +
                         " tier=" + to_string(fgCache.tier) +
                         " risk=" + RiskName(fgCache.risk) +
                         " jitter=" + to_string(fgCache.jmin) + "-" + to_string(fgCache.jmax));
                if (cfgBanRiskLog && fgCache.risk >= RISK_HIGH) {
                    LogEvent("ban-risk " + string(RiskName(fgCache.risk)) + ": " +
                             RiskDescription(fgCache.name, fgCache.risk));
                }
            }
            UpdateTrayTip();
        }
        sensed = fgCache.isGame;
        if (sensed) {
            g_jmin = fgCache.jmin;
            g_jmax = fgCache.jmax;
            g_settle = fgCache.settle;
            g_risk = fgCache.risk;
        }
    }

    // gate hysteresis: open is instant, close needs closeDebounceMs of
    // consecutive non-game polls. This rides through alt-tab, overlay,
    // and fullscreen mode switches that used to flap the log and dump
    // the pending queue (see v1.6.1 log: gate open/close < 1s x2 at start).
    ULONGLONG nowTick = GetTickCount64();
    bool open = sensed;
    if (!sensed && g_gateOpen && cfgCloseDebounceMs > 0) {
        if (g_pendingCloseSince == 0) g_pendingCloseSince = nowTick;
        if (nowTick - g_pendingCloseSince < (ULONGLONG)cfgCloseDebounceMs) {
            open = true;  // grace: keep the gate up, do not drain
        } else {
            g_pendingCloseSince = 0;
        }
    } else {
        g_pendingCloseSince = 0;
    }

    // detect gate transition
    if (open != g_gateOpen) {
        if (open) {
            LogEvent("gate opened");
            InstallHook();               // footprint returns with the game
            if (GetTickCount64() - lastRehookTick > 5000) RefreshHook();
        } else {
            LogEvent("gate closed");
            g_gateClosedAt = GetTickCount64();
        }
        // HARDENING: drain pending queue on CONFIRMED transition only
        DrainPendingQueue(open ? "gate opened" : "gate closed");
        g_gateOpen = open;
        UpdateTrayTip();
    }

    // idle unhook: nothing hooked while the desk is out of the game
    if (!open && hookInstalled && cfgIdleUnhookMs > 0 && g_gateClosedAt != 0) {
        if (GetTickCount64() - g_gateClosedAt > (ULONGLONG)cfgIdleUnhookMs) {
            RemoveHook();
        }
    }
}

static void WatchdogTick() {
    bool gameRunning = false;

    if (cfgUniversal) {
        // hook stays resident in every window; refresh cadence still applies
        gameRunning = true;
    } else if (!cfgAutoDetect) {
        RebuildWatchedPids();
        gameRunning = !watchedNames.empty() && !watchedPids.empty();
    } else {
        gameRunning = fgCache.isGame;
    }

    // periodic refresh while a game owns the foreground, jittered cadence
    if (gameRunning && hookInstalled &&
        (GetTickCount64() - lastRehookTick) > nextRehookGap) {
        RefreshHook();
        LogEvent("hook refreshed");
    }

    // re-arm the watchdog itself with a small jitter so the 2s heartbeat is
    // not a fixed 500.0ms-period signal on the timer queue
    if (g_hwnd) SetTimer(g_hwnd, TIMER_WATCHDOG, (UINT)RandRange(1600, 2400), NULL);
}

// ------------------------------------------------------------- config v3

static string TrimStr(const string& s) {
    size_t b = s.find_first_not_of(" \t\r\n");
    if (b == string::npos) return "";
    size_t e = s.find_last_not_of(" \t\r\n");
    return s.substr(b, e - b + 1);
}

static bool IsSnapKeyName(const string& k) {
    // cafali format: "key" + digits (key1=65 ...). exact-match v3 names first
    // so "toggleKey"/"killKey"/"reloadKey" never land here
    if (k.size() < 4) return false;
    if (k.compare(0, 3, "key") != 0) return false;
    for (size_t i = 3; i < k.size(); i++) {
        if (!isdigit((unsigned char)k[i])) return false;
    }
    return true;
}

static void ParseActiveOn(const string& value) {
    watchedNames.clear();
    stringstream ss(value);
    string item;
    while (getline(ss, item, ',')) {
        string t = TrimStr(item);
        if (!t.empty()) watchedNames.push_back(t);
    }
}

static void ParseExcludeList(const string& value) {
    cfgAutoExclude.clear();
    stringstream ss(value);
    string item;
    while (getline(ss, item, ',')) {
        string t = TrimStr(item);
        if (!t.empty()) cfgAutoExclude.push_back(LowerW(Widen(t)));
    }
}

static void ParseIncludeList(const string& value) {
    cfgAutoInclude.clear();
    stringstream ss(value);
    string item;
    while (getline(ss, item, ',')) {
        string t = TrimStr(item);
        if (!t.empty()) cfgAutoInclude.push_back(LowerW(Widen(t)));
    }
}

static void ResetRuntimeKeyState() {
    for (int i = 0; i < 256; i++) {
        KeyInfo[i] = KeyState();
        suppressNextUp[i] = false;
    }
    groupMembers.clear();
    CancelAllPending();
}

bool LoadConfig(const std::string& filename, bool firstLoad) {
    std::ifstream configFile(filename);
    if (!configFile.is_open()) {
        if (firstLoad) {
            CreateDefaultConfig(filename);
        } else {
            LogEvent("reload failed (config missing) — keeping previous config");
        }
        return false;
    }

    // v4 defaults — a value only sticks if the file carries the line
    int      newStartupMode = STARTUP_REGISTRY; // v1.10.0: logon entry method
    bool     newUniversal  = true;   // v1.9.0: default on, set 0 for detection mode
    int      newJitterMin  = 8;
    int      newJitterMax  = 18;
    int      newSettleMs   = 0;
    int      newIdleUnhook = 3000;
    int      newSkipChance = 0;
    bool     newBanRiskLog = true;
    int      newPollMs     = 100;
    int      newToggleKey  = 0;
    int      newKillKey    = 0;
    int      newReloadKey  = 0;
    int      newCoverPct   = 95;
    int      newCloseMs    = 400;
    int      newGfxRescan  = 2000;
    int      newMinHold    = 12;
    bool     newStealth    = false;  // default off (matches README/config docs)
    bool     newTray       = true;   // default on
    bool     newAutoDetect = true;
    bool     newRequireFs  = true;
    string   newLogFile;
    string   newActiveOn;
    string   newExclude;
    string   newInclude;

    vector<pair<int, int>> regKeys;   // (group, vk)
    vector<GameCfg> games;
    int id = 0;

    int section = 0;   // 0 root, 1 group, 2 game
    GameCfg curGame;
    bool curGameValid = false;

    bool parseError = false;

    string line;
    while (getline(configFile, line)) {
        istringstream iss(line);
        string name;
        if (!getline(iss, name, '=')) continue;
        name = TrimStr(name);
        if (name.empty()) continue;

        // section header — cafali [Group] bumps the group id at each block
        if (name[0] == '[') {
            string lower;
            for (char c : name) lower += (char)tolower((unsigned char)c);
            if (curGameValid) { games.push_back(curGame); curGameValid = false; }
            if (lower == "[group]") { id++; section = 1; }
            else if (lower == "[game]") { section = 2; curGame = GameCfg(); }
            else section = 0;
            continue;
        }

        string valueStr;
        getline(iss, valueStr);
        valueStr = TrimStr(valueStr);

        if (section == 2) {
            bool handled = true;
            if (name == "exe") {
                string v = valueStr;
                size_t slash = v.find_last_of("\\/");
                if (slash != string::npos) v = v.substr(slash + 1);
                curGame.exe = LowerW(Widen(TrimStr(v)));
                curGameValid = !curGame.exe.empty();
            }
            else if (name == "jitterMinMs") curGame.jmin = atoi(valueStr.c_str());
            else if (name == "jitterMaxMs") curGame.jmax = atoi(valueStr.c_str());
            else if (name == "settleMs")    curGame.settleMs = atoi(valueStr.c_str());
            else if (name == "tier")        curGame.tier = max(0, min(3, atoi(valueStr.c_str())));
            else handled = false;
            if (handled) continue;
        }

        if (section == 1) {
            // [Group] body: keyN=vk only, but unknown names fall through to
            // root parsing — cafali configs put settings after the groups
            if (!IsSnapKeyName(name)) {
                // fall through below
            } else {
                int value = atoi(valueStr.c_str());
                if (value <= 0 || value >= 256) continue;   // out of vk range — skip
                bool dup = false;
                for (auto& p : regKeys) if (p.second == value) dup = true;
                if (dup) { parseError = true; break; }
                regKeys.push_back(make_pair(id, value));
                continue;
            }
        }

        // root
        if (name == "universal")            { newUniversal = atoi(valueStr.c_str()) != 0; continue; }
        if (name == "startupMode") {
            string v = LowerStr(valueStr);
            if (v == "off" || v == "0") newStartupMode = STARTUP_OFF;
            else if (v == "folder" || v == "startup" || v == "2") newStartupMode = STARTUP_FOLDER;
            else newStartupMode = STARTUP_REGISTRY;
            continue;
        }
        if (name == "autoDetect")           { newAutoDetect = atoi(valueStr.c_str()) != 0; continue; }
        if (name == "requireFullscreen")    { newRequireFs  = atoi(valueStr.c_str()) != 0; continue; }
        if (name == "coverPct")             { newCoverPct   = atoi(valueStr.c_str()); continue; }
        if (name == "closeDebounceMs")      { newCloseMs    = atoi(valueStr.c_str()); continue; }
        if (name == "gfxRescanMs")          { newGfxRescan  = atoi(valueStr.c_str()); continue; }
        if (name == "minHoldMs")            { newMinHold    = atoi(valueStr.c_str()); continue; }
        if (name == "activeOn")             { newActiveOn   = valueStr; continue; }
        if (name == "autoExclude")          { newExclude    = valueStr; continue; }
        if (name == "autoInclude")          { newInclude    = valueStr; continue; }
        if (name == "jitterMinMs")          { newJitterMin  = atoi(valueStr.c_str()); continue; }
        if (name == "jitterMaxMs")          { newJitterMax  = atoi(valueStr.c_str()); continue; }
        if (name == "settleMs")             { newSettleMs   = atoi(valueStr.c_str()); continue; }
        if (name == "idleUnhookMs")         { newIdleUnhook = atoi(valueStr.c_str()); continue; }
        if (name == "skipChancePct")        { newSkipChance = atoi(valueStr.c_str()); continue; }
        if (name == "banRiskLog")           { newBanRiskLog = atoi(valueStr.c_str()) != 0; continue; }
        if (name == "pollMs")               { newPollMs     = atoi(valueStr.c_str()); continue; }
        if (name == "toggleKey")            { newToggleKey  = atoi(valueStr.c_str()); continue; }
        if (name == "killKey")              { newKillKey    = atoi(valueStr.c_str()); continue; }
        if (name == "reloadKey")            { newReloadKey  = atoi(valueStr.c_str()); continue; }
        if (name == "stealth")              { newStealth    = atoi(valueStr.c_str()) != 0; continue; }
        if (name == "tray")                 { newTray       = atoi(valueStr.c_str()) != 0; continue; }
        if (name == "logFile")              { newLogFile    = valueStr; continue; }

        // tier ranges
        if (name == "tierNoneMinMs")  { cfgTierMin[TIER_NONE] = max(1, atoi(valueStr.c_str())); continue; }
        if (name == "tierNoneMaxMs")  { cfgTierMax[TIER_NONE] = max(1, atoi(valueStr.c_str())); continue; }
        if (name == "tierSoftMinMs")  { cfgTierMin[TIER_SOFT] = max(1, atoi(valueStr.c_str())); continue; }
        if (name == "tierSoftMaxMs")  { cfgTierMax[TIER_SOFT] = max(1, atoi(valueStr.c_str())); continue; }
        if (name == "tierHardMinMs")  { cfgTierMin[TIER_HARD] = max(1, atoi(valueStr.c_str())); continue; }
        if (name == "tierHardMaxMs")  { cfgTierMax[TIER_HARD] = max(1, atoi(valueStr.c_str())); continue; }
        if (name == "tierKeenMinMs")  { cfgTierMin[TIER_KEEN] = max(1, atoi(valueStr.c_str())); continue; }
        if (name == "tierKeenMaxMs")  { cfgTierMax[TIER_KEEN] = max(1, atoi(valueStr.c_str())); continue; }

        // cafali loose keys outside a [Group] header still register on group 0
        if (IsSnapKeyName(name)) {
            int value = atoi(valueStr.c_str());
            if (value <= 0 || value >= 256) continue;
            bool dup = false;
            for (auto& p : regKeys) if (p.second == value) dup = true;
            if (dup) { parseError = true; break; }
            regKeys.push_back(make_pair(id, value));
            continue;
        }
    }
    if (curGameValid) games.push_back(curGame);

    if (parseError) {
        if (firstLoad) {
            MessageBox(NULL,
                       TEXT("The config file contains duplicate keys. Please review the setup."),
                       TEXT("SnapKey Error"), MB_ICONEXCLAMATION | MB_OK);
        } else {
            LogEvent("reload rejected (duplicate keys) — keeping previous config");
        }
        return false;
    }

    // clamp jitter to sane, human ranges — the floor is the whole point
    if (newJitterMin < 1)   newJitterMin = 1;
    if (newJitterMax < newJitterMin) newJitterMax = newJitterMin;
    if (newJitterMax > 100) newJitterMax = 100;
    if (newSettleMs < 0) newSettleMs = 0;
    if (newSkipChance < 0) newSkipChance = 0;
    if (newSkipChance > 20) newSkipChance = 20;
    if (newPollMs < 50) newPollMs = 50;
    if (newPollMs > 1000) newPollMs = 1000;
    if (newIdleUnhook < 0) newIdleUnhook = 0;
    if (newCoverPct < 0) newCoverPct = 0;
    if (newCoverPct > 100) newCoverPct = 100;
    if (newCloseMs < 0) newCloseMs = 0;
    if (newCloseMs > 2000) newCloseMs = 2000;
    if (newGfxRescan < 500) newGfxRescan = 500;
    if (newGfxRescan > 15000) newGfxRescan = 15000;
    if (newMinHold < 0) newMinHold = 0;
    if (newMinHold > 60) newMinHold = 60;

    for (int t = 0; t < 4; t++) {
        if (cfgTierMin[t] < 1) cfgTierMin[t] = 1;
        if (cfgTierMax[t] < cfgTierMin[t]) cfgTierMax[t] = cfgTierMin[t];
        if (cfgTierMax[t] > 100) cfgTierMax[t] = 100;
    }

    ResetRuntimeKeyState();
    for (auto& p : regKeys) {
        KeyInfo[p.second].registered = true;
        KeyInfo[p.second].group = p.first;
        groupMembers[p.first].push_back(p.second);
    }

    cfgUniversal  = newUniversal;
    cfgStartupMode = newStartupMode;
    cfgJitterMin  = newJitterMin;
    cfgJitterMax  = newJitterMax;
    cfgSettleMs   = newSettleMs;
    cfgIdleUnhookMs = newIdleUnhook;
    cfgSkipChance = newSkipChance;
    cfgBanRiskLog = newBanRiskLog;
    cfgPollMs     = newPollMs;
    cfgToggleKey  = newToggleKey;
    cfgKillKey    = newKillKey;
    cfgReloadKey  = newReloadKey;
    cfgStealth    = newStealth;
    cfgTray       = newTray && !newStealth;   // stealth implies no tray
    cfgAutoDetect = newAutoDetect;
    cfgRequireFullscreen = newRequireFs;
    cfgCoverPct   = newCoverPct;
    cfgCloseDebounceMs = newCloseMs;
    cfgGfxRescanMs = newGfxRescan;
    cfgMinHoldMs  = newMinHold;
    cfgLogFile    = newLogFile;
    cfgGames      = games;
    ParseActiveOn(newActiveOn);
    ParseExcludeList(newExclude);
    ParseIncludeList(newInclude);
    g_pendingCloseSince = 0;

    // (re)open the log
    logEnabled = false;
    if (logStream.is_open()) logStream.close();
    if (!cfgLogFile.empty()) {
        logStream.open(cfgLogFile, ios::app);
        logEnabled = logStream.is_open();
    }

    return true;
}

static void ReloadConfig() {
    if (LoadConfig("config.cfg", false)) {
        RebuildWatchedPids();
        fgCache = FgCache();
        LogEvent("config reloaded");
    }
    // tray state follows the reloaded config at runtime
    if (trayActive && !cfgTray) {
        Shell_NotifyIcon(NIM_DELETE, &nid);
        trayActive = false;
    } else if (!trayActive && cfgTray) {
        trayActive = true;
        InitNotifyIconData(g_hwnd);
    }
}

void RestoreConfigFromBackup(const std::string& backupFilename, const std::string& destinationFilename) {
    std::string sourcePath = "meta\\" + backupFilename;
    std::string destinationPath = destinationFilename;

    if (CopyFile(sourcePath.c_str(), destinationPath.c_str(), FALSE)) {
        if (trayActive) {
            MessageBox(NULL, TEXT("Default config restored from backup successfully."),
                       TEXT("SnapKey"), MB_ICONINFORMATION | MB_OK);
        }
    } else if (trayActive) {
        MessageBox(NULL, TEXT("Failed to restore config from backup."),
                   TEXT("SnapKey Error"), MB_ICONERROR | MB_OK);
    }
}

void CreateDefaultConfig(const std::string& filename) {
    RestoreConfigFromBackup("backup.snapkey", filename);
}

// ------------------------------------------------------------- layout tray (cafali's)

vector<string> ListLayouts() {
    vector<string> layouts;
    string path = "meta\\profiles";
    if (!fs::exists(path)) return layouts;

    for (auto& entry : fs::directory_iterator(path)) {
        if (entry.is_regular_file()) {
            auto ext = entry.path().extension().string();
            if (ext == ".cfg") {
                layouts.push_back(entry.path().stem().string());
            }
        }
    }
    return layouts;
}

void ApplyLayout(const string& layoutName) {
    string sourcePath = "meta\\profiles\\" + layoutName + ".cfg";
    string destPath = "config.cfg";

    ifstream src(sourcePath, ios::binary);
    ofstream dst(destPath, ios::binary | ios::trunc);

    if (!src.is_open() || !dst.is_open()) {
        if (trayActive) {
            MessageBox(NULL, TEXT("Failed to apply layout. Please check the layout file."),
                       TEXT("SnapKey Error"), MB_ICONERROR | MB_OK);
        }
        return;
    }

    dst << src.rdbuf();
}

void RestartSnapKey() {
    TCHAR szExeFileName[MAX_PATH];
    GetModuleFileName(NULL, szExeFileName, MAX_PATH);
    ShellExecute(NULL, NULL, szExeFileName, NULL, NULL, SW_SHOWNORMAL);
    PostQuitMessage(0);
}

// ------------------------------------------------------------- injection

// the only synthesized events this build emits: snap release, sticky resume.
// EX scancode mapping so arrow profiles send real arrow codes; vk fallback
// for unmapped keys.
void SendKey(int targetKey, bool keyDown) {
    INPUT input = {0};
    input.type = INPUT_KEYBOARD;

    UINT sc = MapVirtualKeyW((UINT)targetKey, MAPVK_VK_TO_VSC_EX);
    if (sc != 0) {
        input.ki.wScan = (WORD)(sc & 0xFF);
        input.ki.dwFlags = KEYEVENTF_SCANCODE;
        if (sc & 0xE000) input.ki.dwFlags |= KEYEVENTF_EXTENDEDKEY;
    } else {
        input.ki.wVk = (WORD)targetKey;
        input.ki.dwFlags = 0;
    }

    if (!keyDown) input.ki.dwFlags |= KEYEVENTF_KEYUP;
    input.ki.dwExtraInfo = g_magic;
    SendInput(1, &input, sizeof(INPUT));
}

// ------------------------------------------------------------- pending queue

static void CancelPendingFor(int vk) {
    for (int i = 0; i < PENDING_SLOTS; i++) {
        if (pend[i].valid && pend[i].vk == vk) {
            pend[i].valid = false;
            if (g_hwnd) KillTimer(g_hwnd, TIMER_PENDING + i);
        }
    }
}

// a physically released key killed the trigger for its partners' queued
// releases — the physical events settle the state instead
static void CancelPendingPartnerReleases(int group, int vk) {
    auto it = groupMembers.find(group);
    if (it == groupMembers.end()) return;
    for (int m : it->second) {
        if (m == vk) continue;
        for (int i = 0; i < PENDING_SLOTS; i++) {
            if (pend[i].valid && pend[i].vk == m && !pend[i].down) {
                pend[i].valid = false;
                if (g_hwnd) KillTimer(g_hwnd, TIMER_PENDING + i);
            }
        }
    }
}

// HARDENING: drain entire pending queue with logging
static void DrainPendingQueue(const char* reason) {
    for (int i = 0; i < PENDING_SLOTS; i++) {
        if (pend[i].valid) {
            LogEvent(string("pending drained (") + reason + ") " + VkName(pend[i].vk) + (pend[i].down ? " down" : " up"));
            pend[i].valid = false;
            if (g_hwnd) KillTimer(g_hwnd, TIMER_PENDING + i);
        }
    }
    // suppressNextUp intentionally survives gate transitions — a fired
    // injection's redundant physical keyup must still be swallowed or the
    // game's stream goes 1-down-2-up (v1.5 pairing fix).
}

static void QueuePending(int vk, bool down) {
    // human inconsistency: a snap that occasionally does not fire is the same
    // distribution a hand produces. default is 0 — set skipChancePct to taste.
    if (cfgSkipChance > 0 && (RandRange(1, 100) <= cfgSkipChance)) {
        LogEvent("pending skipped (chance) " + VkName(vk));
        return;
    }

    int delay = SnapDelayMs();

    // settleMs: extra dwell before the resume press. some titles swallow a
    // re-press that lands inside the same input frame as the release.
    if (down && g_settle > 0) delay += RandRange(g_settle / 2, g_settle);

    for (int i = 0; i < PENDING_SLOTS; i++) {
        if (pend[i].valid && pend[i].vk == vk && pend[i].down == down) {
            pend[i].due = TicksNow() + MsToTicks(delay);
            pend[i].createdAt = TicksNow();
            if (g_hwnd) SetTimer(g_hwnd, TIMER_PENDING + i, 2, NULL);
            return;
        }
    }
    for (int i = 0; i < PENDING_SLOTS; i++) {
        if (!pend[i].valid) {
            pend[i].valid = true;
            pend[i].vk    = vk;
            pend[i].down  = down;
            pend[i].due   = TicksNow() + MsToTicks(delay);
            pend[i].createdAt = TicksNow();
            if (g_hwnd) SetTimer(g_hwnd, TIMER_PENDING + i, 2, NULL);
            return;
        }
    }
    // queue full — drop rather than misorder
    LogEvent("pending queue full, dropped " + VkName(vk) + (down ? " down" : " up"));
}

static void CancelAllPending() {
    for (int i = 0; i < PENDING_SLOTS; i++) {
        pend[i].valid = false;
        if (g_hwnd) KillTimer(g_hwnd, TIMER_PENDING + i);
    }
}

static void PollPendingSlot(int i) {
    if (!pend[i].valid) {
        if (g_hwnd) KillTimer(g_hwnd, TIMER_PENDING + i);
        return;
    }

    ULONGLONG now = TicksNow();

    // HARDENING: max age discard — stale pendings never fire
    if (pend[i].createdAt > 0) {
        int ageMs = TicksToMs(now - pend[i].createdAt);
        if (ageMs > MAX_PENDING_AGE_MS) {
            pend[i].valid = false;
            if (g_hwnd) KillTimer(g_hwnd, TIMER_PENDING + i);
            LogEvent("pending discarded (max age) " + VkName(pend[i].vk));
            return;
        }
    }

    if (now < pend[i].due) return;   // keep polling at 2ms
    pend[i].valid = false;
    if (g_hwnd) KillTimer(g_hwnd, TIMER_PENDING + i);

    // gate closed since queue time — focus left the game; drop it, the
    // physical events resync naturally
    if (!GateOpen()) {
        LogEvent("pending dropped (gate closed) " + VkName(pend[i].vk));
        return;
    }

    // pairing fix, handled entirely at fire time:
    //   our injected UP  -> the next physical keyup of this key is redundant
    //   our injected DOWN -> it needs its physical keyup to balance — clear
    if (!pend[i].down) suppressNextUp[pend[i].vk] = true;
    else               suppressNextUp[pend[i].vk] = false;

    LogEvent(string(pend[i].down ? "fire press " : "fire release ") + VkName(pend[i].vk));
    if (!pend[i].down) KeyInfo[pend[i].vk].lastReleaseAt = now;
    SendKey(pend[i].vk, pend[i].down);
}

// ------------------------------------------------------------- lock + icon

static void UpdateTrayIcon() {
    if (!trayActive) return;
    HICON hIcon = isLocked
        ? (HICON)LoadImage(NULL, TEXT("icon_off.ico"), IMAGE_ICON, 0, 0, LR_LOADFROMFILE)
        : (HICON)LoadImage(NULL, TEXT("icon.ico"), IMAGE_ICON, 0, 0, LR_LOADFROMFILE);
    if (hIcon) {
        nid.hIcon = hIcon;
        Shell_NotifyIcon(NIM_MODIFY, &nid);
        DestroyIcon(hIcon);
    }
}

static void SetLocked(bool locked) {
    isLocked = locked;
    if (isLocked) CancelAllPending();
    // suppress flags intentionally survive the lock — a fired injection's
    // redundant physical keyup must still be swallowed or the game's stream
    // goes 1-down-2-up
    UpdateTrayIcon();
    UpdateTrayTip();
    LogEvent(isLocked ? "locked (dormant)" : "unlocked (active)");
}

// ------------------------------------------------------------- logon startup
// registry = HKCU Run value quoted exe path; folder = shell:startup launcher.
// Both are per-user, need no elevation, and anchor cwd to the exe directory
// so config.cfg / icons / profiles resolve at logon.

static wstring OwnExePath() {
    WCHAR buf[MAX_PATH + 1] = {0};
    DWORD n = GetModuleFileNameW(NULL, buf, MAX_PATH);
    return n > 0 && n < MAX_PATH ? wstring(buf, n) : wstring();
}

static wstring StartupFolder() {
    WCHAR buf[MAX_PATH + 1] = {0};
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_STARTUP, NULL,
                                   SHGFP_TYPE_CURRENT, buf))) {
        return wstring(buf);
    }
    WCHAR appData[MAX_PATH + 1] = {0};
    DWORD n = GetEnvironmentVariableW(L"APPDATA", appData, MAX_PATH);
    if (n > 0 && n < MAX_PATH) {
        return wstring(appData) +
               L"\\Microsoft\\Windows\\Start Menu\\Programs\\Startup";
    }
    return wstring();
}

static wstring StartupLauncherPath() {
    wstring folder = StartupFolder();
    return folder.empty() ? wstring() : folder + L"\\SnapKey.cmd";
}

static bool RemoveStartupRegistry() {
    HKEY key = NULL;
    if (RegOpenKeyExW(HKEY_CURRENT_USER,
                      L"Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                      0, KEY_SET_VALUE, &key) != ERROR_SUCCESS) return false;
    LONG rc = RegDeleteValueW(key, L"SnapKey");
    RegCloseKey(key);
    return rc == ERROR_SUCCESS || rc == ERROR_FILE_NOT_FOUND;
}

static bool InstallStartupRegistry(const wstring& exe) {
    if (exe.empty()) return false;
    HKEY key = NULL;
    if (RegCreateKeyExW(HKEY_CURRENT_USER,
                        L"Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                        0, NULL, REG_OPTION_NON_VOLATILE, KEY_SET_VALUE,
                        NULL, &key, NULL) != ERROR_SUCCESS) return false;
    const wstring command = L"\"" + exe + L"\"";
    LONG rc = RegSetValueExW(key, L"SnapKey", 0, REG_SZ,
                             (const BYTE*)command.c_str(),
                             (DWORD)((command.size() + 1) * sizeof(WCHAR)));
    RegCloseKey(key);
    return rc == ERROR_SUCCESS;
}

static bool WriteAnsiFile(const wstring& path, const string& content) {
    int needed = MultiByteToWideChar(CP_UTF8, 0, content.c_str(),
                                     (int)content.size(), NULL, 0);
    if (needed <= 0) return false;
    vector<wchar_t> wide((size_t)needed + 1, 0);
    MultiByteToWideChar(CP_UTF8, 0, content.c_str(), (int)content.size(),
                        wide.data(), needed);
    int bytes = WideCharToMultiByte(CP_ACP, 0, wide.data(), needed,
                                    NULL, 0, NULL, NULL);
    if (bytes <= 0) return false;
    vector<char> ansi((size_t)bytes + 1, 0);
    WideCharToMultiByte(CP_ACP, 0, wide.data(), needed,
                        ansi.data(), bytes, NULL, NULL);
    ofstream out(path.c_str(), ios::binary | ios::trunc);
    if (!out.is_open()) return false;
    out.write(ansi.data(), bytes);
    return out.good();
}

static bool InstallStartupFolder(const wstring& exe) {
    wstring launcher = StartupLauncherPath();
    if (exe.empty() || launcher.empty()) return false;
    size_t slash = exe.find_last_of(L"\\/");
    wstring dir = slash == wstring::npos ? wstring() : exe.substr(0, slash);
    // cmd /c start with an explicit title token: quoted exe paths stay one arg
    string body = "@echo off\r\ncd /d \"" + Narrow(dir) + "\"\r\n" +
                  "start \"SnapKey\" \"" + Narrow(exe) + "\"\r\n";
    return WriteAnsiFile(launcher, body);
}

static bool RemoveStartupFolder() {
    wstring launcher = StartupLauncherPath();
    if (launcher.empty()) return false;
    if (!fs::exists(launcher)) return true;
    error_code ec;
    return fs::remove(launcher, ec) || ec.value() == 0;
}

static bool ApplyStartupMode(int mode, string* errorOut) {
    if (mode < STARTUP_OFF || mode > STARTUP_FOLDER) {
        if (errorOut) *errorOut = "startupMode must be 0, 1 or 2";
        return false;
    }
    const wstring exe = OwnExePath();
    if (mode != STARTUP_OFF && exe.empty()) {
        if (errorOut) *errorOut = "cannot resolve own executable path";
        return false;
    }

    bool ok = RemoveStartupRegistry() && RemoveStartupFolder();
    if (mode == STARTUP_REGISTRY) ok = InstallStartupRegistry(exe) && ok;
    else if (mode == STARTUP_FOLDER) ok = InstallStartupFolder(exe) && ok;

    if (!ok && errorOut) *errorOut = "logon entry write failed (per-user policy?)";
    LogEvent(string("startup mode applied: ") +
             (mode == STARTUP_OFF ? "off" :
              mode == STARTUP_REGISTRY ? "registry Run key" : "shell:startup"));
    return ok;
}

static const char* StartupModeName(int mode) {
    return mode == STARTUP_FOLDER ? "folder" :
           mode == STARTUP_REGISTRY ? "registry" : "off";
}

// rewrite only the startupMode line so the tray choice survives a restart;
// other keys and comments stay byte-identical.
static bool WriteStartupMode(int mode) {
    ifstream in("config.cfg");
    if (!in.is_open()) return false;
    vector<string> lines;
    string line;
    bool found = false;
    while (getline(in, line)) {
        string probe = TrimStr(line);
        if (probe.rfind("startupMode", 0) == 0) {
            line = string("startupMode=") + StartupModeName(mode);
            found = true;
        }
        lines.push_back(line);
    }
    in.close();
    if (!found) lines.push_back(string("startupMode=") + StartupModeName(mode));
    ofstream out("config.cfg", ios::binary | ios::trunc);
    if (!out.is_open()) return false;
    for (const string& l : lines) out << l << "\n";
    return out.good();
}

// ------------------------------------------------------------- stealth names

// stable hash of the exe path: same install -> same mutex (single-instance
// check works across launches), no readable name anywhere
static string StableExeHash() {
    WCHAR path[MAX_PATH];
    GetModuleFileNameW(NULL, path, MAX_PATH);
    _wcsupr(path);
    unsigned long long h = 1469598103934665603ULL;
    for (const WCHAR* p = path; *p; ++p) {
        h ^= (unsigned long long)*p;
        h *= 1099511628211ULL;
    }
    char buf[32];
    snprintf(buf, sizeof(buf), "%016llx", h);
    return string(buf);
}

static string RandomLaunchName() {
    unsigned long long a = XorShift();
    unsigned long long b = XorShift();
    char buf[40];
    snprintf(buf, sizeof(buf), "%016llx%016llx", a, b);
    return string(buf);
}

// ------------------------------------------------------------- main

int main() {
    DBG("main enter");
    // DPI: aware so coverage % is measured in the same coordinate space
    // as the monitor rect. System-aware is enough (context API needs
    // _WIN32_WINNT 0x0A00 + newer SDK); window/monitor scale together.
    SetProcessDPIAware();
    // Startup fix: config.cfg, icons, profiles and log are exe-dir relative.
    // When launched from the registry Run key at logon the working dir is
    // System32, not the install folder — anchor to the exe dir first.
    {
        WCHAR exePath[MAX_PATH];
        DWORD n = GetModuleFileNameW(NULL, exePath, MAX_PATH);
        if (n > 0 && n < MAX_PATH) {
            wstring p(exePath, n);
            size_t slash = p.find_last_of(L"\\/");
            if (slash != wstring::npos) {
                wstring dir = p.substr(0, slash);
                if (!dir.empty()) SetCurrentDirectoryW(dir.c_str());
            }
        }
    }
    if (!LoadConfig("config.cfg", true)) {
        DBG("LoadConfig failed");
        return 1;
    }
    // reconcile the logon entry with the persisted choice on every launch
    {
        string startupErr;
        if (!ApplyStartupMode(cfgStartupMode, &startupErr)) LogEvent("startup reconcile: " + startupErr);
    }
    DBG("config ok");
    // log rotation: a session log grows unbounded (v1.6.1 log hit 18kB in
    // ~24h). Rotate once at startup past 256KB instead of growing forever.
    if (!cfgLogFile.empty()) {
        std::error_code ec;
        uintmax_t sz = fs::file_size(cfgLogFile, ec);
        if (!ec && sz > 262144) {
            string bak = cfgLogFile + ".1";
            fs::remove(bak, ec);
            fs::rename(cfgLogFile, bak, ec);
        }
    }

    SeedRng();

    // per-session tag: 64 random bits, never 0, never seen twice
    g_magic = (ULONG_PTR)(XorShift() | 1ULL);

    string mutexName = "Local\\SK-" + StableExeHash();
    string className = "C" + RandomLaunchName();

    hMutex = CreateMutexA(NULL, TRUE, mutexName.c_str());
    if (GetLastError() == ERROR_ALREADY_EXISTS) {
        DBG("mutex exists");
        if (trayActive) {
            MessageBox(NULL, TEXT("SnapKey is already running!"), TEXT("SnapKey"), MB_ICONINFORMATION | MB_OK);
        }
        return 1;
    }

    QueryPerformanceFrequency(&qpcFreq);
    timeBeginPeriod(1);

    WNDCLASSEX wc = {0};
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.lpfnWndProc = WndProc;
    wc.hInstance = GetModuleHandle(NULL);
    wc.lpszClassName = className.c_str();

    if (!RegisterClassEx(&wc)) {
        timeEndPeriod(1);
        ReleaseMutex(hMutex);
        CloseHandle(hMutex);
        return 1;
    }

    HWND hwnd = CreateWindowEx(0, className.c_str(), RandomLaunchName().c_str(),
                               WS_OVERLAPPEDWINDOW,
                               CW_USEDEFAULT, CW_USEDEFAULT, 240, 120,
                               NULL, NULL, wc.hInstance, NULL);

    if (hwnd == NULL) {
        timeEndPeriod(1);
        ReleaseMutex(hMutex);
        CloseHandle(hMutex);
        return 1;
    }
    g_hwnd = hwnd;

    if (cfgTray) {
        trayActive = true;
        InitNotifyIconData(hwnd);
    }

    RebuildWatchedPids();

    // first classification before the first keypress can arrive
    g_gateOpen = cfgUniversal ? true : (cfgAutoDetect ? false : WhitelistGate());
    g_gateWasOpen = g_gateOpen;
    if (cfgUniversal || !cfgAutoDetect) {
        g_jmin = cfgJitterMin;
        g_jmax = cfgJitterMax;
        g_settle = cfgSettleMs;
    } else {
        g_jmin = cfgTierMin[TIER_SOFT];
        g_jmax = cfgTierMax[TIER_SOFT];
    }
    PollTick();

    if ((cfgUniversal || !cfgAutoDetect) && !hookInstalled) {
        hHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardProc, NULL, 0);
        hookInstalled = (hHook != NULL);
        lastRehookTick = GetTickCount64();
        nextRehookGap = (ULONGLONG)RandRange(45000, 90000);
    }

    SetTimer(hwnd, TIMER_WATCHDOG, (UINT)RandRange(1600, 2400), NULL);
    SetTimer(hwnd, TIMER_POLL, (UINT)cfgPollMs, NULL);

    LogEvent("started v1.10.0");
    LogEvent(cfgUniversal ? "universal mode (all windows)"
                          : (cfgAutoDetect ? "autodetect on" : "whitelist mode"));
    LogEvent("gate " + (cfgAutoDetect ? string("autodetect")
                                      : (watchedNames.empty() ? string("always active")
                                                              : string("activeOn=" + to_string(watchedNames.size()) + " proc"))));
    LogEvent("tier jitter none=" + to_string(cfgTierMin[0]) + "-" + to_string(cfgTierMax[0]) +
             " soft=" + to_string(cfgTierMin[1]) + "-" + to_string(cfgTierMax[1]) +
             " hard=" + to_string(cfgTierMin[2]) + "-" + to_string(cfgTierMax[2]) +
             " keen=" + to_string(cfgTierMin[3]) + "-" + to_string(cfgTierMax[3]));
    LogEvent(cfgStealth ? "stealth on" : "tray on");
    if (cfgToggleKey) LogEvent("toggleKey " + VkName(cfgToggleKey));
    if (cfgKillKey)   LogEvent("killKey " + VkName(cfgKillKey));
    if (cfgReloadKey) LogEvent("reloadKey " + VkName(cfgReloadKey));

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    if (hookInstalled) UnhookWindowsHookEx(hHook);
    if (trayActive) Shell_NotifyIcon(NIM_DELETE, &nid);
    KillTimer(hwnd, TIMER_WATCHDOG);
    KillTimer(hwnd, TIMER_POLL);
    for (int i = 0; i < PENDING_SLOTS; i++) KillTimer(hwnd, TIMER_PENDING + i);
    LogEvent("exited");
    timeEndPeriod(1);
    ReleaseMutex(hMutex);
    CloseHandle(hMutex);

    return 0;
}

// ------------------------------------------------------------- hook

LRESULT CALLBACK KeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0 && lParam) {
        KBDLLHOOKSTRUCT *pKeyBoard = (KBDLLHOOKSTRUCT *)lParam;

        bool injected = (pKeyBoard->flags & LLKHF_INJECTED) != 0;
        bool ours     = injected && (pKeyBoard->dwExtraInfo == g_magic);

        // provenance scrub, gate-open only: erase injected flags for the whole
        // chain so every hook after ours sees hardware-shaped events, and zero
        // our own tag so no downstream reader can fingerprint the tool
        if (!isLocked && g_gateOpen) {
            pKeyBoard->flags &= ~(DWORD)(LLKHF_INJECTED | LLKHF_LOWER_IL_INJECTED);
            if (ours) pKeyBoard->dwExtraInfo = 0;
        }

        if (injected) {
            if (ours) {
                int vk = (int)pKeyBoard->vkCode;
                if (vk > 0 && vk < 256) {
                    KeyInfo[vk].gameDown = (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN);
                }
            }
            return CallNextHookEx(hHook, nCode, wParam, lParam);
        }

        // ---- physical event ----
        int vk = (int)pKeyBoard->vkCode;
        bool isDown = (wParam == WM_KEYDOWN   || wParam == WM_SYSKEYDOWN);
        bool isUp   = (wParam == WM_KEYUP      || wParam == WM_SYSKEYUP);

        // hotkeys work in every state, pass through untouched
        if (isDown) {
            if (cfgToggleKey && vk == cfgToggleKey) { SetLocked(!isLocked); return CallNextHookEx(hHook, nCode, wParam, lParam); }
            if (cfgKillKey   && vk == cfgKillKey)   { PostQuitMessage(0);    return CallNextHookEx(hHook, nCode, wParam, lParam); }
            if (cfgReloadKey && vk == cfgReloadKey) { ReloadConfig();       return CallNextHookEx(hHook, nCode, wParam, lParam); }
        }

        if (vk <= 0 || vk >= 256 || !KeyInfo[vk].registered) {
            return CallNextHookEx(hHook, nCode, wParam, lParam);
        }
        if (!isDown && !isUp) {
            return CallNextHookEx(hHook, nCode, wParam, lParam);
        }

        KeyState &ks = KeyInfo[vk];
        ULONGLONG now = TicksNow();

        // ---- pairing fix: swallow the one redundant physical keyup that
        // follows an injected release. runs in every state (locked included)
        // because a fired injection already balanced the game's stream —
        // this is stream hygiene, not snap logic
        if (isUp && suppressNextUp[vk]) {
            suppressNextUp[vk] = false;
            ks.physDown = false;
            ks.gameDown = false;
            // partner resume state is still evaluated so the machine stays
            // complete even on swallowed events
            auto it = groupMembers.find(ks.group);
            if (it != groupMembers.end()) {
                for (int p : it->second) {
                    if (p != vk && KeyInfo[p].physDown && !KeyInfo[p].gameDown) {
                        // sticky resume only after the minimum gap since the
                        // injected release fired
                        ULONGLONG relAt = KeyInfo[p].lastReleaseAt;
                        if (relAt == 0 || TicksToMs(now - relAt) >= STICKY_RESUME_MIN_GAP_MS)
                            QueuePending(p, true);
                    }
                }
            }
            return 1;   // the only physical event this build ever swallows
        }

        if (isLocked) {
            return CallNextHookEx(hHook, nCode, wParam, lParam);
        }

        // gate closed: pure pass-through, state stays fresh for reopening
        if (!GateOpen()) {
            ks.physDown = isDown;
            ks.gameDown = isDown;
            if (isDown) ks.physDownAt = now;
            else ks.physDownAt = 0;
            return CallNextHookEx(hHook, nCode, wParam, lParam);
        }

        // physical events pass to the game untouched
        ks.physDown = isDown;
        ks.gameDown = isDown;

        if (isDown) {
            ks.physDownAt = now;
            CancelPendingFor(vk);
            auto it = groupMembers.find(ks.group);
            if (it != groupMembers.end()) {
                for (int p : it->second) {
                    if (p != vk && KeyInfo[p].physDown && KeyInfo[p].gameDown) {
                        // HARDENING: minimum physical hold before snap release can queue
                        int holdMs = TicksToMs(now - KeyInfo[p].physDownAt);
                        if (holdMs >= cfgMinHoldMs) {
                            QueuePending(p, false);   // snap release
                        }
                    }
                }
            }
        } else {
            ks.physDownAt = 0;
            CancelPendingFor(vk);
            CancelPendingPartnerReleases(ks.group, vk);
            auto it = groupMembers.find(ks.group);
            if (it != groupMembers.end()) {
                for (int p : it->second) {
                    if (p != vk && KeyInfo[p].physDown && !KeyInfo[p].gameDown) {
                        // HARDENING: sticky resume requires explicit partner
                        // release (gameDown == false = we already injected a
                        // release for it) AND the minimum gap since that
                        // release fired
                        ULONGLONG relAt = KeyInfo[p].lastReleaseAt;
                        if (relAt == 0 || TicksToMs(now - relAt) >= STICKY_RESUME_MIN_GAP_MS)
                            QueuePending(p, true);   // sticky resume
                    }
                }
            }
        }

        // NEVER swallow — the physical event reaches the game
        return CallNextHookEx(hHook, nCode, wParam, lParam);
    }
    return CallNextHookEx(hHook, nCode, wParam, lParam);
}

// ------------------------------------------------------------- tray

void InitNotifyIconData(HWND hwnd) {
    memset(&nid, 0, sizeof(NOTIFYICONDATA));
    nid.cbSize = sizeof(NOTIFYICONDATA);
    nid.hWnd = hwnd;
    nid.uID = ID_TRAY_APP_ICON;
    nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    nid.uCallbackMessage = WM_TRAYICON;

    HICON hIcon = (HICON)LoadImage(NULL, TEXT("icon.ico"), IMAGE_ICON, 0, 0, LR_LOADFROMFILE);
    nid.hIcon = hIcon ? hIcon : LoadIcon(NULL, IDI_APPLICATION);
    lstrcpy(nid.szTip, TEXT("SnapKey"));
    Shell_NotifyIcon(NIM_ADD, &nid);
}

// live tray tooltip: detected title + tier, or off. Cheap: only writes
// when the text actually changes.
static void UpdateTrayTip() {
    if (!trayActive) return;
    char tip[128];
    if (isLocked) snprintf(tip, sizeof(tip), "SnapKey: OFF");
    else if (cfgUniversal) snprintf(tip, sizeof(tip), "SnapKey: universal (all windows)");
    else if (fgCache.isGame && !fgCache.name.empty())
        snprintf(tip, sizeof(tip), "SnapKey: %s (t%d %s risk)",
                 Narrow(fgCache.name).c_str(), fgCache.tier,
                 RiskName(fgCache.risk));
    else snprintf(tip, sizeof(tip), "SnapKey: no game");
    if (strcmp(tip, nid.szTip) != 0) {
        strncpy(nid.szTip, tip, sizeof(nid.szTip) - 1);
        nid.szTip[sizeof(nid.szTip) - 1] = 0;
        Shell_NotifyIcon(NIM_MODIFY, &nid);
    }
}

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
    case WM_TRAYICON:
        if (!trayActive) break;
        if (lParam == WM_RBUTTONDOWN) {
            POINT curPoint;
            GetCursorPos(&curPoint);
            SetForegroundWindow(hwnd);

            HMENU hMenu = CreatePopupMenu();
            AppendMenu(hMenu, MF_STRING, ID_TRAY_REBIND_KEYS, TEXT("Rebind Keys"));

            HMENU hSubMenu = CreatePopupMenu();
            vector<string> layouts = ListLayouts();
            if (!layouts.empty()) {
                int id = 0;
                for (auto& layout : layouts) {
                    AppendMenuA(hSubMenu, MF_STRING, ID_LAYOUT_BASE + id, layout.c_str());
                    id++;
                }
            } else {
                AppendMenu(hSubMenu, MF_GRAYED, 0, TEXT("No layouts found"));
            }
            AppendMenu(hMenu, MF_POPUP, (UINT_PTR)hSubMenu, TEXT("Select Profile"));

            AppendMenu(hMenu, MF_STRING, ID_TRAY_AUTODETECT,
                       cfgUniversal ? TEXT("Universal: ON (all windows)")
                                    : (cfgAutoDetect ? TEXT("Autodetect: ON (all games)")
                                                     : TEXT("Autodetect: OFF (whitelist)")));
            {
                string det = cfgUniversal
                    ? string("Mode: universal (every window)")
                    : (fgCache.isGame && !fgCache.name.empty()
                        ? string("Detected: ") + Narrow(fgCache.name) +
                          string(" [") + RiskName(fgCache.risk) + " risk]"
                        : string("Detected: none (hover tray tip)"));
                AppendMenuA(hMenu, MF_STRING, ID_TRAY_DETECTED, det.c_str());
            }
            HMENU hStartup = CreatePopupMenu();
            {
                AppendMenuA(hStartup, MF_STRING | (cfgStartupMode == STARTUP_OFF ? MF_CHECKED : 0),
                            ID_STARTUP_BASE + 0, "Off");
                AppendMenuA(hStartup, MF_STRING | (cfgStartupMode == STARTUP_REGISTRY ? MF_CHECKED : 0),
                            ID_STARTUP_BASE + 1, "Registry Run key");
                AppendMenuA(hStartup, MF_STRING | (cfgStartupMode == STARTUP_FOLDER ? MF_CHECKED : 0),
                            ID_STARTUP_BASE + 2, "shell:startup folder");
                AppendMenu(hMenu, MF_POPUP, (UINT_PTR)hStartup, TEXT("Start with Windows"));
            }
            AppendMenu(hMenu, MF_STRING, ID_TRAY_LOCK_FUNCTION, isLocked ? TEXT("Disable SnapKey") : TEXT("Enable SnapKey"));
            AppendMenu(hMenu, MF_STRING, ID_TRAY_RESTART_SNAPKEY, TEXT("Restart SnapKey"));
            AppendMenu(hMenu, MF_SEPARATOR, 0, NULL);
            AppendMenu(hMenu, MF_STRING, ID_TRAY_HELP, TEXT("Get Help"));
            AppendMenu(hMenu, MF_STRING, ID_TRAY_CHECKUPDATE, TEXT("Check Updates"));
            AppendMenu(hMenu, MF_STRING, ID_TRAY_VERSION_INFO, TEXT("Version Info (1.10.0)"));
            AppendMenu(hMenu, MF_SEPARATOR, 0, NULL);
            AppendMenu(hMenu, MF_STRING, ID_TRAY_EXIT_CONTEXT_MENU_ITEM, TEXT("Exit SnapKey"));

            TrackPopupMenu(hMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, curPoint.x, curPoint.y, 0, hwnd, NULL);
            DestroyMenu(hMenu);
            DestroyMenu(hSubMenu);
            DestroyMenu(hStartup);
        } else if (lParam == WM_LBUTTONDBLCLK) {
            SetLocked(!isLocked);
        }
        break;

    case WM_COMMAND:
        if (LOWORD(wParam) == ID_TRAY_EXIT_CONTEXT_MENU_ITEM) {
            PostQuitMessage(0);
        } else if (LOWORD(wParam) == ID_TRAY_LOCK_FUNCTION) {
            SetLocked(!isLocked);
        } else if (LOWORD(wParam) == ID_TRAY_RESTART_SNAPKEY) {
            RestartSnapKey();
        } else if (LOWORD(wParam) == ID_TRAY_VERSION_INFO) {
            MessageBox(hwnd, GetVersionInfo().c_str(), TEXT("SnapKey Version Info"), MB_OK);
        } else if (LOWORD(wParam) == ID_TRAY_REBIND_KEYS) {
            ShellExecute(NULL, TEXT("open"), TEXT("config.cfg"), NULL, NULL, SW_SHOWNORMAL);
        } else if (LOWORD(wParam) == ID_TRAY_HELP) {
            ShellExecute(NULL, TEXT("open"), TEXT("README.md"), NULL, NULL, SW_SHOWNORMAL);
        } else if (LOWORD(wParam) == ID_TRAY_CHECKUPDATE) {
            if (MessageBox(NULL,
                           TEXT("You are about to visit the SnapKey GitHub page. Continue?"),
                           TEXT("Update SnapKey"),
                           MB_YESNO | MB_ICONQUESTION) == IDYES) {
                ShellExecute(NULL, TEXT("open"), TEXT("https://github.com/cafali/SnapKey/releases"), NULL, NULL, SW_SHOWNORMAL);
            }
        } else if (LOWORD(wParam) >= ID_STARTUP_BASE && LOWORD(wParam) < ID_STARTUP_BASE + 3) {
            int chosen = (int)(LOWORD(wParam) - ID_STARTUP_BASE);
            string error;
            if (!ApplyStartupMode(chosen, &error)) {
                MessageBoxA(hwnd, error.c_str(), "SnapKey startup", MB_OK | MB_ICONERROR);
            } else {
                cfgStartupMode = chosen;
                if (!WriteStartupMode(chosen)) {
                    LogEvent("startup mode applied but config.cfg write failed");
                }
                LogEvent(string("startup mode selected: ") + StartupModeName(cfgStartupMode));
            }
        } else if (LOWORD(wParam) == ID_TRAY_AUTODETECT) {
            cfgUniversal = !cfgUniversal;
            fgCache = FgCache();
            g_pendingCloseSince = 0;
            if (cfgUniversal) {
                g_gateOpen = true;
                g_jmin = cfgJitterMin;
                g_jmax = cfgJitterMax;
                g_settle = cfgSettleMs;
                g_risk = RISK_LOW;
                if (!hookInstalled) InstallHook();
                LogEvent("universal toggled on (all windows)");
            } else {
                g_gateOpen = cfgAutoDetect ? false : WhitelistGate();
                LogEvent("universal toggled off (detection mode)");
            }
        } else if (LOWORD(wParam) == ID_TRAY_DETECTED) {
            if (cfgUniversal) {
                MessageBox(hwnd,
                           TEXT("Universal mode: the group transform is active in every window.\n")
                           TEXT("No title classification or per-game policy is applied."),
                           TEXT("SnapKey Universal"), MB_OK);
            } else if (fgCache.isGame) {
                string body = "Detected: " + Narrow(fgCache.name) +
                              "\nTier: " + to_string(fgCache.tier) +
                              "\nBan risk: " + RiskName(fgCache.risk) +
                              "\nJitter: " + to_string(fgCache.jmin) + "-" + to_string(fgCache.jmax) + "ms" +
                              "\n\n" + RiskDescription(fgCache.name, fgCache.risk);
                MessageBoxA(hwnd, body.c_str(), "SnapKey Autodetect", MB_OK);
            } else {
                MessageBox(hwnd, TEXT("No game detected in the foreground."), TEXT("SnapKey Autodetect"), MB_OK);
            }
        } else if (LOWORD(wParam) >= ID_LAYOUT_BASE && LOWORD(wParam) < ID_LAYOUT_BASE + 100) {
            vector<string> layouts = ListLayouts();
            int idx = LOWORD(wParam) - ID_LAYOUT_BASE;
            if (idx >= 0 && idx < (int)layouts.size()) {
                ApplyLayout(layouts[idx]);
                RestartSnapKey();
            }
        }
        break;

    case WM_TIMER:
        if (wParam == TIMER_POLL) {
            PollTick();
        } else if (wParam == TIMER_WATCHDOG) {
            WatchdogTick();
        } else if (wParam >= TIMER_PENDING && wParam < TIMER_PENDING + PENDING_SLOTS) {
            PollPendingSlot((int)(wParam - TIMER_PENDING));
        }
        break;

    case WM_DESTROY:
        PostQuitMessage(0);
        break;
    }
    return DefWindowProc(hwnd, msg, wParam, lParam);
}

// ------------------------------------------------------------- version

std::string GetVersionInfo() {
    return "SnapKey v1.10.0\n"
           "Keyboard group input handler — universal mode, glitch-hardened.\n"
           "Base: github.com/cafali/SnapKey (MIT)\n"
           "Mode:   universal=1 (default): group transform active in every window,\n"
           "        global jitter range, no title classification / risk policy.\n"
           "        universal=0: legacy autodetect (~150-title table + suffix +\n"
           "        GPU/coverage heuristic) or whitelist (activeOn) mode.\n"
           "Startup: working dir anchored to exe dir.\n"
           "Logon:   startupMode=registry (per-user Run key) / folder (shell:startup)\n"
           "         / off. Choose from the tray 'Start with Windows' menu.\n"
           "Config: universal / autoDetect / autoExclude / autoInclude /\n"
           "        requireFullscreen / coverPct / closeDebounceMs / gfxRescanMs /\n"
           "        minHoldMs / jitterMinMs / jitterMaxMs / tier*MinMs / tier*MaxMs /\n"
           "        settleMs / idleUnhookMs / skipChancePct / banRiskLog / pollMs /\n"
           "        toggleKey / killKey / reloadKey / stealth / tray / logFile\n";
}