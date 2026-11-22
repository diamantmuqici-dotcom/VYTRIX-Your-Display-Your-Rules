//! Port of the public Platinum+ Optimizer v9.5 tweak set.
//!
//! Source: https://sourceforge.net/projects/platinum-optimizer/
//! Original authors credited in the upstream header: @STEFANO83223, @Aledect.
//! This module is not affiliated with or maintained by the upstream authors.
//! Every entry is expressed as a fixed registry write backed by the same
//! value-capture and restore path used by the VYTRIX catalog. No path or value
//! ever arrives from IPC; the list below is compiled into the binary.

use super::{HKCU, HKLM, OsTarget, RegistryTask, Target};

pub const ATTRIBUTION: &str = "Not mine. Ported from Platinum+ Optimizer v9.5 by @STEFANO83223 and @Aledect (SourceForge). Upstream updates are not ours.";
pub const SOURCE_URL: &str = "https://sourceforge.net/projects/platinum-optimizer/";
pub const VERSION: &str = "9.5";

pub fn benefit_for(category: &str) -> &'static str {
    match category {
        "memory" => "Reduces memory-management background work and paging overhead.",
        "graphics" => "Cuts DWM and driver scheduler latency around the game loop.",
        "storage" => "Trims NTFS and NVMe housekeeping on the I/O path.",
        "performance" => "Raises multimedia and foreground-process scheduling priority.",
        "power" => "Removes idle power transitions while the system is active.",
        "privacy" => "Stops consumer-content and telemetry delivery work.",
        "appearance" => "Removes composition work from Explorer and the desktop.",
        "services" => "Moves non-security services to on-demand startup.",
        "network" => "Tunes the TCP/IP stack for lower-latency traffic.",
        _ => "Documented Windows tuning entry from the Platinum+ profile.",
    }
}

macro_rules! pt {
    ($id:expr, $cat:expr, $name:expr, $hive:expr, $path:expr, $value:expr, $target:expr) => {
        RegistryTask {
            id: $id,
            category: $cat,
            name: $name,
            description: format!("Platinum+ v9.5 — {}\\{}", $path, $value),
            benefit: benefit_for($cat),
            risk: "medium",
            hive: $hive,
            path: $path,
            value: $value,
            target: $target,
        }
    };
    ($id:expr, $cat:expr, $name:expr, $hive:expr, $path:expr, $value:expr, $target:expr, $risk:expr) => {
        RegistryTask {
            id: $id,
            category: $cat,
            name: $name,
            description: format!("Platinum+ v9.5 — {}\\{}", $path, $value),
            benefit: benefit_for($cat),
            risk: $risk,
            hive: $hive,
            path: $path,
            value: $value,
            target: $target,
        }
    };
}

const MM: &str = r"SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management";
const PREFETCH: &str = r"SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management\PrefetchParameters";
const IOSYS: &str = r"SYSTEM\CurrentControlSet\Control\Session Manager\I/O System";
const FS: &str = r"SYSTEM\CurrentControlSet\Control\FileSystem";
const GD: &str = r"SYSTEM\CurrentControlSet\Control\GraphicsDrivers";
const GDS: &str = r"SYSTEM\CurrentControlSet\Control\GraphicsDrivers\Scheduler";
const DWM: &str = r"SOFTWARE\Microsoft\Windows\DWM";
const POWER: &str = r"SYSTEM\CurrentControlSet\Control\Power";
const MMPROFILE: &str = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile";
const GAMES: &str = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games";
const CDM: &str = r"SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager";
const CLOUD: &str = r"SOFTWARE\Policies\Microsoft\Windows\CloudContent";
const EXADV: &str = r"Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced";
const DESKTOP: &str = r"Control Panel\Desktop";
const NVME: &str = r"SYSTEM\CurrentControlSet\Services\stornvme\Parameters\Device";
const AHCI: &str = r"SYSTEM\CurrentControlSet\Services\storahci\Parameters\Device";

/// Fixed catalog translated from the upstream script's registry section.
pub(crate) fn catalog() -> Vec<RegistryTask> {
    use Target::{Dword, Text};
    vec![
        // Memory management
        pt!("pt-mm-cache", "memory", "Large system cache", HKLM, MM, "LargeSystemCache", Dword(0)),
        pt!("pt-mm-throttle", "memory", "Memory throttling", HKLM, MM, "DisableMemoryThrottling", Dword(1)),
        pt!("pt-mm-split", "memory", "Page splitting", HKLM, MM, "DisablePageSplitting", Dword(1)),
        pt!("pt-mm-scrub", "memory", "Memory scrubbing", HKLM, MM, "DisableMemoryScrubbing", Dword(1)),
        pt!("pt-mm-scavenge", "memory", "Background scavenging", HKLM, MM, "DisableBackgroundScavenging", Dword(1)),
        pt!("pt-mm-driver-paging", "memory", "Driver paging", HKLM, MM, "DisableDriverPaging", Dword(1)),
        pt!("pt-mm-kernel-stack", "memory", "Kernel stack paging", HKLM, MM, "DisableKernelStackPaging", Dword(1)),
        pt!("pt-mm-stack-paging", "memory", "Kernel stack paging policy", HKLM, MM, "DisablePagingOfKernelStacks", Dword(1)),
        pt!("pt-mm-pool-tagging", "memory", "Pool tagging", HKLM, MM, "DisablePoolTagging", Dword(1)),
        pt!("pt-mm-pool-usage", "memory", "Pool usage maximum", HKLM, MM, "PoolUsageMaximum", Dword(60)),
        pt!("pt-mm-move-images", "memory", "Move images", HKLM, MM, "MoveImages", Dword(0)),
        pt!("pt-mm-features", "memory", "Memory feature settings", HKLM, MM, "FeatureSettings", Dword(1), "high"),
        pt!("pt-mm-clear-pagefile", "memory", "Clear pagefile at shutdown", HKLM, MM, "ClearPageFileAtShutdown", Dword(0)),
        pt!("pt-mm-trim", "memory", "Trim working set", HKLM, MM, "TrimWorkingSet", Dword(0)),
        pt!("pt-mm-writewatch", "memory", "Write watch", HKLM, MM, "WriteWatch", Dword(0)),
        pt!("pt-mm-map-transfer", "memory", "Map transfer count", HKLM, MM, "MapTransferCount", Dword(0)),
        pt!("pt-mm-priority", "memory", "Memory management priority", HKLM, MM, "MemoryManagementPriority", Dword(1)),
        pt!("pt-mm-memory-priority", "memory", "Memory priority", HKLM, MM, "MemoryPriority", Dword(1)),
        pt!("pt-mm-pool-priority", "memory", "Pool allocation priority", HKLM, MM, "PoolAllocationPriority", Dword(1)),
        pt!("pt-mm-cache-reserve", "memory", "System cache reserve", HKLM, MM, "SystemCacheReserve", Dword(1)),
        pt!("pt-mm-large-pages", "memory", "Large pages always", HKLM, MM, "LargePageAlways", Dword(1)),
        pt!("pt-mm-foreground", "memory", "Foreground application priority", HKLM, MM, "PrioritizeForegroundApplications", Dword(1)),
        pt!("pt-mm-large-collisions", "memory", "Large page collisions", HKLM, MM, "AvoidLargePageCollisions", Dword(1)),
        pt!("pt-mm-large-min", "memory", "Large page minimum", HKLM, MM, "LargePageMinimum", Dword(0)),
        pt!("pt-mm-commit-limit", "memory", "Commit limit", HKLM, MM, "CommitLimit", Dword(0xFFFF_FFFF), "high"),
        pt!("pt-prefetch", "memory", "Prefetcher", HKLM, PREFETCH, "EnablePrefetcher", Dword(0)),
        pt!("pt-superfetch", "memory", "Superfetch", HKLM, PREFETCH, "EnableSuperfetch", Dword(0)),
        pt!("pt-boottrace", "memory", "Boot trace", HKLM, PREFETCH, "EnableBootTrace", Dword(0)),
        pt!("pt-readahead", "memory", "Read-ahead", HKLM, PREFETCH, "EnableReadAhead", Dword(0)),
        pt!("pt-seekahead", "memory", "Seek-ahead", HKLM, PREFETCH, "EnableSeekAhead", Dword(0)),
        pt!("pt-readahead-max", "memory", "Maximum read-ahead", HKLM, PREFETCH, "MaxReadAheadSize", Dword(0)),
        pt!("pt-prefetch-attempts", "memory", "Prefetch attempts", HKLM, PREFETCH, "PrefetchAttempts", Dword(0)),
        pt!("pt-sf-tracing", "memory", "Superfetch tracing", HKLM, PREFETCH, "SfTracingState", Dword(0)),

        // Graphics and composition
        pt!("pt-gd-hwsch", "graphics", "Hardware scheduler mode", HKLM, GD, "HwSchMode", Dword(2)),
        pt!("pt-gd-maxlatency", "graphics", "Maximum frame latency", HKLM, GD, "MaxFrameLatency", Dword(1)),
        pt!("pt-gd-maxframes", "graphics", "Maximum queued frames", HKLM, GD, "MaximumFrameLatency", Dword(1)),
        pt!("pt-gd-queue-size", "graphics", "Frame queue size", HKLM, GD, "FrameQueueSize", Dword(1)),
        pt!("pt-gd-queue-depth", "graphics", "Frame queue depth", HKLM, GD, "FrameQueueDepth", Dword(1)),
        pt!("pt-gd-fse", "graphics", "Full-screen exclusive", HKLM, GD, "FSE_Enable", Dword(1)),
        pt!("pt-gd-async-present", "graphics", "Asynchronous presentation", HKLM, GD, "EnableAsyncPresentation", Dword(1)),
        pt!("pt-gd-vsync-latency", "graphics", "VSync latency update", HKLM, GD, "DisableVsyncLatencyUpdate", Dword(1)),
        pt!("pt-gd-iommu", "graphics", "DMA remapping", HKLM, GD, "DmaRemappingCompatible", Dword(0)),
        pt!("pt-gd-tdr-delay", "graphics", "TDR delay", HKLM, GD, "TdrDelay", Dword(10)),
        pt!("pt-gd-tdr-level", "graphics", "TDR level", HKLM, GD, "TdrLevel", Dword(8), "high"),
        pt!("pt-gd-d3d9-queue", "graphics", "D3D9 async queue", HKLM, GD, "D3D9AsyncQueue", Dword(1)),
        pt!("pt-gd-overlays", "graphics", "Driver overlays", HKLM, GD, "DisableOverlays", Dword(0)),
        pt!("pt-gd-driver-checks", "graphics", "Driver verification level", HKLM, GD, "VerifyDriverLevel", Dword(0)),
        pt!("pt-gd-gpu-priority-change", "graphics", "GPU priority change mode", HKLM, GD, "GpuPriorityChangeMode", Dword(1)),
        pt!("pt-gd-completion", "graphics", "High priority completion", HKLM, GD, "HighPriorityCompletionMode", Dword(1)),
        pt!("pt-gds-policy", "graphics", "GPU scheduler policy", HKLM, GDS, "SchedulePolicy", Dword(4)),
        pt!("pt-gds-gpu-priority", "graphics", "GPU thread priority", HKLM, GDS, "GpuPriority", Dword(31)),
        pt!("pt-gds-thread-priority", "graphics", "Graphics thread priority", HKLM, GDS, "ThreadPriority", Dword(31)),
        pt!("pt-gds-async-compute", "graphics", "Async compute", HKLM, GDS, "EnableAsyncCompute", Dword(1)),
        pt!("pt-gds-preemptive", "graphics", "Preemptive scheduling", HKLM, GDS, "EnablePreemptiveScheduling", Dword(1)),
        pt!("pt-gds-poll", "graphics", "Poll status iterations", HKLM, GDS, "PollStatusIterations", Dword(1)),
        pt!("pt-gds-vsync-thread", "graphics", "VSync thread priority", HKLM, GDS, "VsyncCpuThreadPriority", Dword(15)),
        pt!("pt-gds-preemption", "graphics", "GPU preemption", HKLM, GDS, "EnablePreemption", Dword(0)),
        pt!("pt-dwm-flip", "graphics", "Direct flip", HKLM, DWM, "ForceDirectFlip", Dword(1)),
        pt!("pt-dwm-independent-flip", "graphics", "Independent flip", HKLM, DWM, "EnableIndependentFlip", Dword(1)),
        pt!("pt-dwm-thumbnails", "graphics", "Thumbnail hibernation", HKLM, DWM, "AlwaysHibernateThumbnails", Dword(0)),
        pt!("pt-dwm-ghosting", "graphics", "Window ghosting", HKLM, DWM, "DisableProcessWindowsGhosting", Dword(1)),
        pt!("pt-dwm-buffers", "graphics", "Maximum queued buffers", HKLM, DWM, "MaxQueuedBuffers", Dword(1)),
        pt!("pt-dwm-overlay", "graphics", "Overlay support", HKLM, DWM, "OverlaySupported", Dword(1)),
        pt!("pt-dwm-drawlist", "graphics", "Hardware draw list", HKLM, DWM, "UseHWDrawList", Dword(1)),
        pt!("pt-dwm-overlays", "graphics", "DWM overlays", HKLM, DWM, "DisableOverlays", Dword(0)),
        pt!("pt-dwm-user-thumbnails", "graphics", "User thumbnail hibernation", HKCU, r"Software\Microsoft\Windows\DWM", "AlwaysHibernateThumbnails", Dword(0)),
        pt!("pt-dwm-peek", "graphics", "Aero Peek", HKCU, r"Software\Microsoft\Windows\DWM", "EnableAeroPeek", Dword(0)),

        // Storage and I/O
        pt!("pt-ntfs-access", "storage", "NTFS last access", HKLM, FS, "NtfsDisableLastAccessUpdate", Dword(1)),
        pt!("pt-ntfs-8dot3", "storage", "8.3 name creation", HKLM, FS, "NtfsDisable8dot3NameCreation", Dword(1)),
        pt!("pt-ntfs-compression", "storage", "NTFS compression", HKLM, FS, "NtfsDisableCompression", Dword(1)),
        pt!("pt-ntfs-encryption", "storage", "NTFS encryption", HKLM, FS, "NtfsDisableEncryption", Dword(1)),
        pt!("pt-ntfs-mft", "storage", "MFT zone reservation", HKLM, FS, "NtfsMftZoneReservation", Dword(4)),
        pt!("pt-ntfs-memory", "storage", "NTFS memory usage", HKLM, FS, "NtfsMemoryUsage", Dword(2)),
        pt!("pt-ntfs-longpaths", "storage", "Long paths", HKLM, FS, "LongPathsEnabled", Dword(1)),
        pt!("pt-ntfs-contig", "storage", "Contiguous allocation", HKLM, FS, "ContigFileAllocSize", Dword(64)),
        pt!("pt-ntfs-tunnel", "storage", "Maximum tunnel entries", HKLM, FS, "MaximumTunnelEntries", Dword(0)),
        pt!("pt-ntfs-tunnel-age", "storage", "Tunnel entry age", HKLM, FS, "MaximumTunnelEntryAgeInSeconds", Dword(0)),
        pt!("pt-refs-access", "storage", "ReFS last access", HKLM, FS, "RefsDisableLastAccessUpdate", Dword(1)),
        pt!("pt-io-length", "storage", "Maximum I/O length", HKLM, IOSYS, "IOMaximumLength", Dword(1_048_576)),
        pt!("pt-io-read-limit", "storage", "Read operation limit", HKLM, IOSYS, "IoReadOperationLimit", Dword(65_536)),
        pt!("pt-io-write-limit", "storage", "Write operation limit", HKLM, IOSYS, "IoWriteOperationLimit", Dword(65_536)),
        pt!("pt-io-other-limit", "storage", "Other operation limit", HKLM, IOSYS, "IoOtherOperationLimit", Dword(65_536)),
        pt!("pt-io-priority", "storage", "I/O priority hint", HKLM, IOSYS, "IoPriorityHint", Dword(3)),
        pt!("pt-io-ring", "storage", "IoRing", HKLM, IOSYS, "EnableIoRing", Dword(1)),
        pt!("pt-io-bypass", "storage", "Bypass I/O", HKLM, IOSYS, "BypassIosEnable", Dword(1)),
        pt!("pt-io-tls-calls", "storage", "Thread library calls", HKLM, IOSYS, "DisableThreadLibraryCalls", Dword(1)),
        pt!("pt-io-steering", "storage", "Interrupt steering", HKLM, IOSYS, "InterruptSteeringDisabled", Dword(0)),
        pt!("pt-io-deadline", "storage", "I/O match deadline", HKLM, IOSYS, "IOMatchDeadline", Dword(0)),
        pt!("pt-io-flags", "storage", "I/O optimization flags", HKLM, IOSYS, "OptimizationFlags", Dword(0x0040_0000)),
        pt!("pt-nvme-bypass", "storage", "NVMe bypass I/O", HKLM, NVME, "BypassIoEnable", Dword(1)),
        pt!("pt-nvme-idle", "storage", "NVMe idle power", HKLM, NVME, "DisableIdlePowerManagement", Dword(1)),
        pt!("pt-nvme-flush", "storage", "NVMe cache flush", HKLM, NVME, "DisableWriteCacheBufferFlush", Dword(1), "high"),
        pt!("pt-nvme-dpc", "storage", "NVMe DPC isolation", HKLM, NVME, "DpcIsolation", Dword(1)),
        pt!("pt-nvme-mode", "storage", "NVMe idle mode", HKLM, NVME, "IdlePowerMode", Dword(0)),
        pt!("pt-nvme-irq", "storage", "NVMe interrupt priority", HKLM, NVME, "InterruptPriority", Dword(3)),
        pt!("pt-nvme-msi", "storage", "NVMe MSI limit", HKLM, NVME, "MessageNumberLimit", Dword(2048)),
        pt!("pt-nvme-timeout", "storage", "NVMe command timeout", HKLM, NVME, "NvmeCommandTimeout", Dword(300)),
        pt!("pt-nvme-queue", "storage", "NVMe concurrency", HKLM, NVME, "NvmeMaxIoConcurrency", Dword(128)),
        pt!("pt-ahci-idle", "storage", "AHCI idle power", HKLM, AHCI, "DisableIdlePowerManagement", Dword(1)),
        pt!("pt-ahci-dipm", "storage", "AHCI DIPM", HKLM, AHCI, "EnableDIPM", Dword(0)),
        pt!("pt-ahci-hipm", "storage", "AHCI HIPM", HKLM, AHCI, "EnableHIPM", Dword(0)),
        pt!("pt-ahci-mode", "storage", "AHCI idle mode", HKLM, AHCI, "IdlePowerMode", Dword(0)),

        // Scheduling and foreground priority
        pt!("pt-mmprofile-net", "performance", "Multimedia network throttling", HKLM, MMPROFILE, "NetworkThrottlingIndex", Dword(0xFFFF_FFFF)),
        pt!("pt-mmprofile-response", "performance", "System responsiveness", HKLM, MMPROFILE, "SystemResponsiveness", Dword(10)),
        pt!("pt-mmprofile-priority", "performance", "Multimedia priority", HKLM, MMPROFILE, "Priority", Dword(6)),
        pt!("pt-games-gpu", "performance", "Games GPU priority", HKLM, GAMES, "GPU Priority", Dword(8)),
        pt!("pt-games-priority", "performance", "Games scheduling priority", HKLM, GAMES, "Priority", Dword(6)),
        pt!("pt-games-category", "performance", "Games scheduling category", HKLM, GAMES, "Scheduling Category", Text("High".into())),
        pt!("pt-games-sfio", "performance", "Games SFIO priority", HKLM, GAMES, "SFIO Priority", Text("High".into())),
        pt!("pt-games-latency", "performance", "Games latency sensitive", HKLM, GAMES, "Latency Sensitive", Text("True".into())),
        pt!("pt-gdvr-enabled", "performance", "Game DVR capture", HKCU, r"System\GameConfigStore", "GameDVR_Enabled", Dword(0)),
        pt!("pt-gdvr-fse", "performance", "Game DVR full-screen mode", HKCU, r"System\GameConfigStore", "GameDVR_FSEBehaviorMode", Dword(2)),
        pt!("pt-gdvr-honor", "performance", "Honor user full-screen mode", HKCU, r"System\GameConfigStore", "GameDVR_HonorUserFSEBehaviorMode", Dword(1)),
        pt!("pt-gdvr-dxgi", "performance", "DXGI full-screen compatibility", HKCU, r"System\GameConfigStore", "GameDVR_DXGIHonorFSEWindowsCompatible", Dword(1)),
        pt!("pt-gdvr-flags", "performance", "Game DVR feature flags", HKCU, r"System\GameConfigStore", "GameDVR_EFSEFeatureFlags", Dword(0)),
        pt!("pt-priority-foreground", "performance", "Win32 priority separation", HKLM, r"SYSTEM\CurrentControlSet\Control\PriorityControl", "Win32PrioritySeparation", Dword(2)),

        // Power
        pt!("pt-power-lowlatency", "power", "Low latency mode", HKLM, POWER, "LowLatencyMode", Dword(1)),
        pt!("pt-power-lowlatency-state", "power", "Low latency state", HKLM, POWER, "LowLatencyState", Dword(2)),
        pt!("pt-power-cpu-max", "power", "Processor performance maximum", HKLM, POWER, "ProcessorPerformanceMaximum", Dword(100)),
        pt!("pt-power-cpu-util", "power", "CPU utilization percentage", HKLM, POWER, "CpuUtilizationPercentage", Dword(100)),
        pt!("pt-power-turbo", "power", "Energy efficient turbo", HKLM, POWER, "EnergyEfficientTurbo", Dword(0)),
        pt!("pt-power-aoac", "power", "Modern standby override", HKLM, POWER, "PlatformAoAcOverride", Dword(0), "high"),
        pt!("pt-power-hibernate", "power", "Hibernate enabled", HKLM, POWER, "HibernateEnabled", Dword(0)),
        pt!("pt-power-hiberfile", "power", "Hiberfile enabled", HKLM, POWER, "HiberFileEnabled", Dword(0)),
        pt!("pt-power-memory-mode", "power", "Memory performance mode", HKLM, POWER, "MemoryPerformanceMode", Dword(1)),
        pt!("pt-power-busy", "power", "CPU busy budgeting", HKLM, POWER, "CpuBusyBudgeting", Dword(0)),
        pt!("pt-power-estimate", "power", "Energy estimation", HKLM, POWER, "EnergyEstimationDisabled", Dword(1)),
        pt!("pt-power-sensor", "power", "Sensor watchdog", HKLM, POWER, "DisableSensorWatchdog", Dword(1)),
        pt!("pt-power-fabric-clock", "power", "Fabric clock gating", HKLM, POWER, "FabricClockGating", Dword(0)),
        pt!("pt-power-lclk-clock", "power", "Link clock gating", HKLM, POWER, "LclkClockGating", Dword(0)),
        pt!("pt-power-events", "power", "Event processor", HKLM, POWER, "EventProcessorEnabled", Dword(0)),
        pt!("pt-power-fast-s4", "power", "Fast S4", HKLM, POWER, "FastS4", Dword(0)),

        // Privacy and consumer content
        pt!("pt-cdm-delivery", "privacy", "Consumer content delivery", HKCU, CDM, "ContentDeliveryAllowed", Dword(0)),
        pt!("pt-cdm-oem", "privacy", "OEM preinstalled apps", HKCU, CDM, "OemPreInstalledAppsEnabled", Dword(0)),
        pt!("pt-cdm-preinstalled", "privacy", "Preinstalled apps", HKCU, CDM, "PreInstalledAppsEnabled", Dword(0)),
        pt!("pt-cdm-ever", "privacy", "Preinstalled app history", HKCU, CDM, "PreInstalledAppsEverEnabled", Dword(0)),
        pt!("pt-cdm-silent", "privacy", "Silent app installs", HKCU, CDM, "SilentInstalledAppsEnabled", Dword(0)),
        pt!("pt-cdm-lock-screen", "privacy", "Rotating lock screen", HKCU, CDM, "RotatingLockScreenEnabled", Dword(0)),
        pt!("pt-cdm-lock-overlay", "privacy", "Lock screen overlay", HKCU, CDM, "RotatingLockScreenOverlayEnabled", Dword(0)),
        pt!("pt-cdm-tips", "privacy", "Suggested content 338387", HKCU, CDM, "SubscribedContent-338387Enabled", Dword(0)),
        pt!("pt-cdm-offers", "privacy", "Suggested content 338388", HKCU, CDM, "SubscribedContent-338388Enabled", Dword(0)),
        pt!("pt-cdm-tracking", "privacy", "Suggested content 338389", HKCU, CDM, "SubscribedContent-338389Enabled", Dword(0)),
        pt!("pt-cdm-history", "privacy", "Suggested content 353694", HKCU, CDM, "SubscribedContent-353694Enabled", Dword(0)),
        pt!("pt-cdm-recommend", "privacy", "Suggested content 353696", HKCU, CDM, "SubscribedContent-353696Enabled", Dword(0)),
        pt!("pt-cdm-curated", "privacy", "Suggested content 353698", HKCU, CDM, "SubscribedContent-353698Enabled", Dword(0)),
        pt!("pt-cloud-consumer", "privacy", "Consumer features", HKLM, CLOUD, "DisableWindowsConsumerFeatures", Dword(1)),
        pt!("pt-cloud-softlanding", "privacy", "First-run soft landing", HKLM, CLOUD, "DisableSoftLanding", Dword(1)),
        pt!("pt-cloud-account", "privacy", "Consumer account content", HKLM, CLOUD, "DisableConsumerAccountStateContent", Dword(1)),
        pt!("pt-cloud-spotlight", "privacy", "Spotlight features", HKLM, CLOUD, "DisableWindowsSpotlightFeatures", Dword(1)),
        pt!("pt-cloud-spotlight-center", "privacy", "Spotlight in action center", HKLM, CLOUD, "DisableWindowsSpotlightOnActionCenter", Dword(1)),
        pt!("pt-cloud-spotlight-welcome", "privacy", "Spotlight welcome experience", HKLM, CLOUD, "DisableWindowsSpotlightWindowsWelcomeExperience", Dword(1)),
        pt!("pt-telemetry-max", "privacy", "Maximum telemetry level", HKLM, r"SOFTWARE\Microsoft\Windows\DataCollection", "MaxTelemetryAllowed", Dword(0), "high"),
        pt!("pt-device-metadata", "privacy", "Device metadata from network", HKLM, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Device Metadata", "PreventDeviceMetadataFromNetwork", Dword(1)),
        pt!("pt-copilot-button", "privacy", "Copilot button", HKLM, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced", "ShowCopilotButton", Dword(0)),

        // Explorer and desktop
        pt!("pt-explorer-preview", "appearance", "Preview pane", HKCU, EXADV, "DisablePreviewPane", Dword(1)),
        pt!("pt-explorer-extensions", "appearance", "Hide known file extensions", HKCU, EXADV, "HideFileExt", Dword(0)),
        pt!("pt-explorer-icons", "appearance", "Always show icons", HKCU, EXADV, "IconsOnly", Dword(1)),
        pt!("pt-explorer-alpha", "appearance", "Alpha selection", HKCU, EXADV, "ListviewAlphaSelect", Dword(0)),
        pt!("pt-explorer-shadow", "appearance", "List view shadows", HKCU, EXADV, "ListviewShadow", Dword(0)),
        pt!("pt-explorer-process", "appearance", "Separate Explorer process", HKCU, EXADV, "SeparateProcess", Dword(0)),
        pt!("pt-explorer-trackdocs", "appearance", "Track recent documents", HKCU, EXADV, "Start_TrackDocs", Dword(0)),
        pt!("pt-explorer-animations", "appearance", "Taskbar animations", HKCU, EXADV, "TaskbarAnimations", Dword(0)),
        pt!("pt-desktop-endtasks", "appearance", "End tasks on shutdown", HKCU, DESKTOP, "AutoEndTasks", Text("1".into())),
        pt!("pt-desktop-drag", "appearance", "Drag full windows", HKCU, DESKTOP, "DragFullWindows", Text("1".into())),
        pt!("pt-desktop-smoothing", "appearance", "Font smoothing", HKCU, DESKTOP, "FontSmoothing", Text("2".into())),
        pt!("pt-desktop-menu", "appearance", "Menu show delay", HKCU, DESKTOP, "MenuShowDelay", Text("50".into())),
        pt!("pt-desktop-killtimeout", "appearance", "Wait to kill timeout", HKCU, DESKTOP, "WaitToKillAppTimeout", Text("5000".into())),
        pt!("pt-desktop-scroll", "appearance", "Smooth scrolling", HKCU, DESKTOP, "SmoothScroll", Dword(0)),
        pt!("pt-desktop-visualfx", "appearance", "Visual effects preset", HKCU, DESKTOP, "VisualFXSetting", Dword(3)),
        pt!("pt-desktop-minanimate", "appearance", "Window minimize animation", HKCU, r"Control Panel\Desktop\WindowMetrics", "MinAnimate", Text("0".into())),

        // Services. Start values mirror `sc config ... start=` without disabling update or security services.
        pt!("pt-svc-diagtrack", "services", "Connected telemetry service", HKLM, r"SYSTEM\CurrentControlSet\Services\DiagTrack", "Start", Dword(4), "high"),
        pt!("pt-svc-dmwapp", "services", "Push notification routing", HKLM, r"SYSTEM\CurrentControlSet\Services\dmwappushservice", "Start", Dword(4), "high"),
        pt!("pt-svc-wer", "services", "Windows error reporting", HKLM, r"SYSTEM\CurrentControlSet\Services\WerSvc", "Start", Dword(4)),
        pt!("pt-svc-stisvc", "services", "Image acquisition", HKLM, r"SYSTEM\CurrentControlSet\Services\stisvc", "Start", Dword(4)),
        pt!("pt-svc-search", "services", "Windows Search", HKLM, r"SYSTEM\CurrentControlSet\Services\WSearch", "Start", Dword(2)),
        pt!("pt-svc-storsvc", "services", "Storage service", HKLM, r"SYSTEM\CurrentControlSet\Services\StorSvc", "Start", Dword(3)),
        pt!("pt-svc-appx", "services", "App installer service", HKLM, r"SYSTEM\CurrentControlSet\Services\AppXSvc", "Start", Dword(3)),
        pt!("pt-svc-install", "services", "Install service", HKLM, r"SYSTEM\CurrentControlSet\Services\InstallService", "Start", Dword(3)),
        pt!("pt-svc-clipsvc", "services", "Clipboard service", HKLM, r"SYSTEM\CurrentControlSet\Services\ClipSVC", "Start", Dword(3)),
        pt!("pt-svc-pushtoinstall", "services", "Push to install", HKLM, r"SYSTEM\CurrentControlSet\Services\PushToInstall", "Start", Dword(3)),
        pt!("pt-svc-wuauserv", "services", "Windows Update startup", HKLM, r"SYSTEM\CurrentControlSet\Services\wuauserv", "Start", Dword(3), "high"),
        pt!("pt-svc-waasmedic", "services", "Update medic service", HKLM, r"SYSTEM\CurrentControlSet\Services\WaaSMedicSvc", "Start", Dword(3), "high"),
        pt!("pt-svc-usosvc", "services", "Update orchestrator", HKLM, r"SYSTEM\CurrentControlSet\Services\UsoSvc", "Start", Dword(3), "high"),
        pt!("pt-svc-bits", "services", "Background transfer", HKLM, r"SYSTEM\CurrentControlSet\Services\BITS", "Start", Dword(3)),
        pt!("pt-svc-vss", "services", "Volume shadow copy", HKLM, r"SYSTEM\CurrentControlSet\Services\VSS", "Start", Dword(2)),
        pt!("pt-svc-swprv", "services", "Shadow copy provider", HKLM, r"SYSTEM\CurrentControlSet\Services\swprv", "Start", Dword(2)),
        pt!("pt-svc-w32time", "services", "Windows time", HKLM, r"SYSTEM\CurrentControlSet\Services\W32Time", "Start", Dword(3)),
        pt!("pt-svc-trkwks", "services", "Distributed link tracking", HKLM, r"SYSTEM\CurrentControlSet\Services\TrkWks", "Start", Dword(2)),
        pt!("pt-svc-themes", "services", "Themes", HKLM, r"SYSTEM\CurrentControlSet\Services\Themes", "Start", Dword(2)),
        pt!("pt-svc-fontcache", "services", "Font cache", HKLM, r"SYSTEM\CurrentControlSet\Services\FontCache", "Start", Dword(2)),
        pt!("pt-svc-camsvc", "services", "Camera service", HKLM, r"SYSTEM\CurrentControlSet\Services\camsvc", "Start", Dword(2)),
        pt!("pt-svc-sdrsvc", "services", "System diagnostics", HKLM, r"SYSTEM\CurrentControlSet\Services\SDRSVC", "Start", Dword(3)),
        pt!("pt-svc-vds", "services", "Virtual disk", HKLM, r"SYSTEM\CurrentControlSet\Services\vds", "Start", Dword(3)),
        pt!("pt-svc-tablet", "services", "Tablet input", HKLM, r"SYSTEM\CurrentControlSet\Services\TabletInputService", "Start", Dword(2)),
        pt!("pt-svc-bthserv", "services", "Bluetooth support", HKLM, r"SYSTEM\CurrentControlSet\Services\bthserv", "Start", Dword(3)),
        pt!("pt-svc-btag", "services", "Bluetooth AG service", HKLM, r"SYSTEM\CurrentControlSet\Services\BTAGService", "Start", Dword(3)),
    ]
}

/// Windows 11-only entries stay off Windows 10 builds.
pub fn os_for(id: &str) -> OsTarget {
    match id {
        "pt-copilot-button" => OsTarget::Win11,
        _ => OsTarget::All,
    }
}

pub struct PlatinumGroup {
    pub id: &'static str,
    pub title: &'static str,
    pub detail: &'static str,
    pub task_ids: Vec<String>,
}

const GROUPS: &[(&str, &str, &str)] = &[
    ("memory", "Memory & prefetch", "Paging, pool and cache behaviour, plus prefetch tracing."),
    ("graphics", "Graphics & composition", "DWM flip model, frame queues and GPU scheduler priorities."),
    ("storage", "Storage & NVMe", "NTFS housekeeping, I/O limits and NVMe/AHCI power states."),
    ("performance", "Scheduling & input", "Multimedia task priorities and full-screen capture behaviour."),
    ("power", "Power & latency", "Processor, standby and low-latency power settings."),
    ("privacy", "Privacy & telemetry", "Consumer content, Spotlight and diagnostic data delivery."),
    ("appearance", "Explorer & desktop", "Composition cost in Explorer, taskbar and window effects."),
    ("services", "Service startup", "On-demand startup for non-security, non-Defender services."),
    ("network", "TCP/IP stack", "netsh global settings with their prior values captured for restore."),
];

pub fn groups() -> Vec<PlatinumGroup> {
    let catalog = catalog();
    let commands = super::command_catalog();
    GROUPS.iter().map(|(id, title, detail)| {
        let mut ids: Vec<String> = catalog.iter()
            .filter(|task| task.category == *id)
            .map(|task| task.id.to_owned())
            .collect();
        ids.extend(commands.iter()
            .filter(|task| task.category == *id)
            .map(|task| task.id.to_owned()));
        PlatinumGroup { id, title, detail, task_ids: ids }
    }).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn platinum_ids_are_unique_and_stable() {
        let catalog = catalog();
        assert!(catalog.len() >= 100, "expected the full Platinum registry set");
        let mut ids: Vec<&str> = catalog.iter().map(|task| task.id).collect();
        let total = ids.len();
        ids.sort_unstable();
        ids.dedup();
        assert_eq!(ids.len(), total);
        assert!(catalog.iter().all(|task| task.id.starts_with("pt-")));
    }

    #[test]
    fn platinum_groups_cover_every_task() {
        let expected = catalog().len() + super::super::command_catalog().len();
        let grouped: Vec<String> = groups().into_iter().flat_map(|group| group.task_ids).collect();
        assert_eq!(grouped.len(), expected);
    }
}
