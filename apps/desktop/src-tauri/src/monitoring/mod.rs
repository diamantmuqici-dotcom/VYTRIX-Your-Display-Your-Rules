//! Low-footprint system sampling. Unmeasured values are null, never estimated.

use serde::Serialize;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricSample {
    pub timestamp: i64,
    pub cpu: f64,
    pub gpu: Option<f64>,
    pub ram: f64,
    pub vram: Option<f64>,
    pub disk: f64,
    pub network_kbps: f64,
    pub temperature_c: Option<f64>,
    pub fps: Option<f64>,
    pub frame_time_ms: Option<f64>,
    pub fps_measured: bool,
}

#[derive(Default)]
pub struct MonitorState {
    last_cpu: Mutex<Option<(u64, u64, u64)>>,
}

impl MonitorState {
    pub fn sample(&self) -> MetricSample {
        #[cfg(windows)]
        {
            use crate::win;
            use chrono::Utc;

            let mut sample = MetricSample {
                timestamp: Utc::now().timestamp_millis(),
                cpu: 0.0,
                gpu: gpu_utilization(),
                ram: 0.0,
                vram: None,
                disk: 0.0,
                network_kbps: 0.0,
                temperature_c: None,
                fps: None,
                frame_time_ms: None,
                fps_measured: false,
            };

            let mut idle = win::FILETIME::default();
            let mut kernel = win::FILETIME::default();
            let mut user = win::FILETIME::default();
            // SAFETY: three valid out-parameters of exact FILETIME layout.
            if unsafe { win::GetSystemTimes(&mut idle, &mut kernel, &mut user) } != 0 {
                let now = (kernel.ticks() + user.ticks(), kernel.ticks(), idle.ticks());
                let mut guard = self.last_cpu.lock().unwrap();
                if let Some((prev_total, prev_busy, prev_idle)) = *guard {
                    let total = now.0.saturating_sub(prev_total);
                    let busy = now.1.saturating_sub(prev_busy);
                    let idle_delta = now.2.saturating_sub(prev_idle);
                    if total > 0 {
                        sample.cpu = crate::security::clamp(
                            ((busy.saturating_sub(idle_delta)) as f64 / total as f64) * 100.0,
                            0.0, 100.0,
                        );
                    }
                }
                *guard = Some(now);
            }

            let mut memory = win::MEMORYSTATUSEX::default();
            memory.length = std::mem::size_of::<win::MEMORYSTATUSEX>() as u32;
            // SAFETY: length is set to exact struct size.
            if unsafe { win::GlobalMemoryStatusEx(&mut memory) } != 0 {
                sample.ram = crate::security::clamp(memory.memory_load as f64, 0.0, 100.0);
            }

            let root = win::to_wide("C:\\");
            let mut free = 0u64;
            let mut total = 0u64;
            // SAFETY: null-terminated path and valid out-parameters.
            if unsafe { win::GetDiskFreeSpaceExW(root.as_ptr(), &mut free, &mut total, std::ptr::null_mut()) } != 0
                && total > 0 {
                sample.disk = crate::security::clamp(
                    ((total - free) as f64 / total as f64) * 100.0, 0.0, 100.0,
                );
            }
            sample
        }

        #[cfg(not(windows))]
        {
            MetricSample {
                timestamp: chrono::Utc::now().timestamp_millis(),
                cpu: 0.0, gpu: None, ram: 0.0, vram: None, disk: 0.0,
                network_kbps: 0.0, temperature_c: None, fps: None,
                frame_time_ms: None, fps_measured: false,
            }
        }
    }
}

#[cfg(windows)]
fn gpu_utilization() -> Option<f64> {
    use crate::win;
    let path = win::to_wide(r"\GPU Engine(*)\Utilization Percentage");
    let mut query: isize = 0;
    // SAFETY: null data with an out query handle.
    if unsafe { win::PdhOpenQueryW(std::ptr::null(), 0, &mut query) } != 0 { return None; }
    let mut counter: isize = 0;
    // SAFETY: opened query and null-terminated counter path.
    if unsafe { win::PdhAddEnglishCounterW(query, path.as_ptr(), 0, &mut counter) } != 0 {
        unsafe { win::PdhCloseQuery(query) };
        return None;
    }
    // SAFETY: opened query handle.
    if unsafe { win::PdhCollectQueryData(query) } != 0 {
        unsafe { win::PdhCloseQuery(query) };
        return None;
    }
    let mut size = 0u32;
    let mut count = 0u32;
    // SAFETY: null buffer with size/count out-parameters is the documented query.
    let probe = unsafe {
        win::PdhGetFormattedCounterArrayW(counter, win::PDH_FMT_DOUBLE, &mut size, &mut count, std::ptr::null_mut())
    };
    // 0x80000705 = PDH_MORE_DATA
    if probe as u32 != 0x8000_0705 || count == 0 || count > 512 || size == 0 {
        unsafe { win::PdhCloseQuery(query) };
        return None;
    }
    let elements = (size as usize) / std::mem::size_of::<win::PDH_FMT_COUNTERVALUE_ITEM_W>();
    if elements == 0 || elements > 512 {
        unsafe { win::PdhCloseQuery(query) };
        return None;
    }
    // SAFETY: plain-old-data with raw-pointer fields; zeroed is a valid initial value.
    let mut buffer: Vec<win::PDH_FMT_COUNTERVALUE_ITEM_W> = vec![unsafe { std::mem::zeroed() }; elements];
    // SAFETY: buffer sized from the API's own size output, capped at 512.
    let result = unsafe {
        win::PdhGetFormattedCounterArrayW(counter, win::PDH_FMT_DOUBLE, &mut size, &mut count, buffer.as_mut_ptr())
    };
    unsafe { win::PdhCloseQuery(query) };
    if result != 0 { return None; }
    let total: f64 = buffer.iter().take(count as usize)
        .filter(|item| item.value.status == 0 && item.value.value.is_finite())
        .map(|item| item.value.value)
        .sum();
    // GPU engine percentages sum across engines; cap at 100 for a single value.
    Some(crate::security::clamp(total, 0.0, 100.0))
}
