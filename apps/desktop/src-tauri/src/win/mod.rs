//! Direct, documented Win32 entry points used by the native modules.
//! Every buffer passed across this boundary is fixed-size and bounded.

#![cfg(windows)]

#![allow(non_snake_case)]
#![allow(non_camel_case_types)]

use std::ffi::c_void;

pub const CCHDEVICENAME: usize = 32;
pub const TH32CS_SNAPPROCESS: u32 = 0x00000002;
pub const INVALID_HANDLE_VALUE: isize = -1;
pub const ERROR_SUCCESS: i32 = 0;
pub const ERROR_NO_MORE_FILES: i32 = 18;
pub const HKEY_CURRENT_USER: isize = 0x8000_0001u32 as i32 as isize;
pub const HKEY_LOCAL_MACHINE: isize = 0x8000_0002u32 as i32 as isize;
pub const KEY_READ: u32 = 0x0002_0019;
pub const KEY_SET_VALUE: u32 = 0x0000_0002;
pub const REG_SZ: u32 = 1;
pub const REG_DWORD: u32 = 4;
pub const DISP_CHANGE_SUCCESSFUL: i32 = 0;
pub const CDS_TEST: u32 = 0x0000_0002;
pub const CDS_FULLSCREEN: u32 = 0x0000_0004;
pub const DM_POSITION: u32 = 0x0000_0020;
pub const DM_DISPLAYFLAGS: u32 = 0x0020_0000;
pub const DM_DISPLAYFREQUENCY: u32 = 0x0040_0000;
pub const DM_PELSWIDTH: u32 = 0x0008_0000;
pub const DM_PELSHEIGHT: u32 = 0x0010_0000;
pub const ENUM_CURRENT_SETTINGS: i32 = -1;
pub const PDH_FMT_DOUBLE: u32 = 0x0000_0200;
pub const WM_HOTKEY: u32 = 0x0312;
pub const WM_QUIT: u32 = 0x0012;
pub const QS_ALLINPUT: u32 = 0x04FF;
pub const MOD_ALT: u32 = 0x0001;
pub const MOD_CONTROL: u32 = 0x0002;
pub const MOD_SHIFT: u32 = 0x0004;
pub const MOD_WIN: u32 = 0x0008;

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct RECT {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct POINTL {
    pub x: i32,
    pub y: i32,
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct DmDisplay {
    pub position: POINTL,
    pub orientation: u32,
    pub fixed_output: u32,
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct DmPrint {
    pub orientation: i16,
    pub paper_size: i16,
    pub paper_length: i16,
    pub paper_width: i16,
    pub scale: i16,
    pub copies: i16,
    pub default_source: i16,
    pub print_quality: i16,
}

#[repr(C)]
#[derive(Clone, Copy)]
pub union DmUnion {
    pub display: DmDisplay,
    pub print: DmPrint,
}

impl Default for DmUnion {
    fn default() -> Self {
        Self { display: DmDisplay::default() }
    }
}

#[repr(C)]
#[derive(Clone, Copy)]
pub struct DEVMODEW {
    pub device_name: [u16; CCHDEVICENAME],
    pub spec_version: u16,
    pub driver_version: u16,
    pub size: u16,
    pub driver_extra: u16,
    pub fields: u32,
    pub dm: DmUnion,
    pub color: i16,
    pub duplex: i16,
    pub y_resolution: i16,
    pub tt_option: i16,
    pub collate: i16,
    pub form_name: [u16; 32],
    pub log_pixels: u16,
    pub bits_per_pel: u32,
    pub pels_width: u32,
    pub pels_height: u32,
    pub display_flags: u32,
    pub display_frequency: u32,
    pub icm_method: u32,
    pub icm_intent: u32,
    pub media_type: u32,
    pub dither_type: u32,
    pub reserved1: u32,
    pub reserved2: u32,
    pub panning_width: u32,
    pub panning_height: u32,
}

const _: () = assert!(std::mem::size_of::<DEVMODEW>() == 220, "DEVMODEW layout mismatch");

impl Default for DEVMODEW {
    fn default() -> Self {
        // SAFETY: all-zero bits are valid for this plain-old-data struct.
        let mut value: Self = unsafe { std::mem::zeroed() };
        value.spec_version = 0x0500;
        value.size = std::mem::size_of::<Self>() as u16;
        value
    }
}

#[repr(C)]
#[derive(Clone, Copy)]
pub struct MONITORINFOEXW {
    pub cb_size: u32,
    pub rc_monitor: RECT,
    pub rc_work: RECT,
    pub flags: u32,
    pub device_name: [u16; CCHDEVICENAME],
}

impl Default for MONITORINFOEXW {
    fn default() -> Self {
        let mut value: Self = unsafe { std::mem::zeroed() };
        value.cb_size = std::mem::size_of::<Self>() as u32;
        value
    }
}

const _: () = assert!(std::mem::size_of::<MONITORINFOEXW>() == 104, "MONITORINFOEXW layout mismatch");

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct FILETIME {
    pub low: u32,
    pub high: u32,
}

impl FILETIME {
    pub fn ticks(self) -> u64 {
        ((self.high as u64) << 32) | self.low as u64
    }
}

#[repr(C)]
#[derive(Clone, Copy)]
pub struct PROCESSENTRY32W {
    pub size: u32,
    pub usage: u32,
    pub process_id: u32,
    pub default_heap_id: usize,
    pub module_id: u32,
    pub threads: u32,
    pub parent_process_id: u32,
    pub base_priority: i32,
    pub flags: u32,
    pub exe_file: [u16; 260],
}

impl Default for PROCESSENTRY32W {
    fn default() -> Self {
        let mut value: Self = unsafe { std::mem::zeroed() };
        value.size = std::mem::size_of::<Self>() as u32;
        value
    }
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct MEMORYSTATUSEX {
    pub length: u32,
    pub memory_load: u32,
    pub total_phys: u64,
    pub avail_phys: u64,
    pub total_page_file: u64,
    pub avail_page_file: u64,
    pub total_virtual: u64,
    pub avail_virtual: u64,
    pub avail_extended_virtual: u64,
}

#[repr(C)]
#[derive(Clone, Copy)]
pub struct PDH_FMT_COUNTERVALUE {
    pub status: i32,
    pub value: f64,
}

#[repr(C)]
#[derive(Clone, Copy)]
pub struct PDH_FMT_COUNTERVALUE_ITEM_W {
    pub name: *mut u16,
    pub value: PDH_FMT_COUNTERVALUE,
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct MSG {
    pub hwnd: *mut c_void,
    pub message: u32,
    pub w_param: usize,
    pub l_param: isize,
    pub time: u32,
    pub pt_x: i32,
    pub pt_y: i32,
}

#[repr(C)]
#[derive(Clone, Copy)]
pub struct WNDCLASSW {
    pub style: u32,
    pub lpfn_wnd_proc: usize,
    pub cb_cls_extra: i32,
    pub cb_wnd_extra: i32,
    pub h_instance: *mut c_void,
    pub h_icon: *mut c_void,
    pub h_cursor: *mut c_void,
    pub hbr_background: *mut c_void,
    pub lpsz_menu_name: *const u16,
    pub lpsz_class_name: *const u16,
}

pub type MonitorEnumProc = extern "system" fn(*mut c_void, *mut c_void, *const RECT, isize) -> i32;
pub type WndProc = extern "system" fn(*mut c_void, u32, usize, isize) -> isize;

#[link(name = "user32")]
extern "system" {
    pub fn EnumDisplaySettingsW(device: *const u16, mode: i32, devmode: *mut DEVMODEW) -> i32;
    pub fn ChangeDisplaySettingsExW(device: *const u16, devmode: *mut DEVMODEW, hwnd: *mut c_void, flags: u32, param: *const c_void) -> i32;
    pub fn EnumDisplayMonitors(hdc: *mut c_void, clip: *const RECT, callback: MonitorEnumProc, param: isize) -> i32;
    pub fn GetMonitorInfoW(monitor: *mut c_void, info: *mut MONITORINFOEXW) -> i32;
    pub fn RegisterClassW(class: *const WNDCLASSW) -> u16;
    pub fn CreateWindowExW(ex_style: u32, class: *const u16, name: *const u16, style: u32,
        x: i32, y: i32, width: i32, height: i32, parent: *mut c_void, menu: *mut c_void,
        instance: *mut c_void, param: *mut c_void) -> *mut c_void;
    pub fn DestroyWindow(hwnd: *mut c_void) -> i32;
    pub fn RegisterHotKey(hwnd: *mut c_void, id: i32, modifiers: u32, vk: u32) -> i32;
    pub fn UnregisterHotKey(hwnd: *mut c_void, id: i32) -> i32;
    pub fn GetMessageW(msg: *mut MSG, hwnd: *mut c_void, filter_min: u32, filter_max: u32) -> i32;
    pub fn TranslateMessage(msg: *const MSG) -> i32;
    pub fn DispatchMessageW(msg: *const MSG) -> isize;
    pub fn PeekMessageW(msg: *mut MSG, hwnd: *mut c_void, filter_min: u32, filter_max: u32, remove: u32) -> i32;
    pub fn DefWindowProcW(hwnd: *mut c_void, message: u32, w_param: usize, l_param: isize) -> isize;
    pub fn PostQuitMessage(code: i32);
    pub fn GetSystemMetrics(index: i32) -> i32;
    pub fn GetDC(hwnd: *mut c_void) -> *mut c_void;
    pub fn ReleaseDC(hwnd: *mut c_void, dc: *mut c_void) -> i32;
    pub fn GetAsyncKeyState(virtual_key: i32) -> i16;
    pub fn SetProcessDPIAware() -> i32;
}

// Full-screen magnification: documented Magnification API, no injection.
#[link(name = "magnification")]
extern "system" {
    pub fn MagInitialize() -> i32;
    pub fn MagUninitialize() -> i32;
    pub fn MagSetFullscreenTransform(mag_level: f32, x_offset: i32, y_offset: i32) -> i32;
}

// Gamma ramps and display DCs live in gdi32, not user32; a separate link block
// keeps the native test build working on non-Windows hosts.
#[link(name = "gdi32")]
extern "system" {
    pub fn GetDeviceGammaRamp(dc: *mut c_void, ramp: *mut c_void) -> i32;
    pub fn SetDeviceGammaRamp(dc: *mut c_void, ramp: *const c_void) -> i32;
    pub fn CreateDCW(driver: *const u16, device: *const u16, output: *const u16,
        init_data: *const c_void) -> *mut c_void;
    pub fn DeleteDC(dc: *mut c_void) -> i32;
}

#[link(name = "kernel32")]
extern "system" {
    pub fn CreateToolhelp32Snapshot(flags: u32, process_id: u32) -> isize;
    pub fn Process32FirstW(snapshot: isize, entry: *mut PROCESSENTRY32W) -> i32;
    pub fn Process32NextW(snapshot: isize, entry: *mut PROCESSENTRY32W) -> i32;
    pub fn CloseHandle(handle: isize) -> i32;
    pub fn GetSystemTimes(idle: *mut FILETIME, kernel: *mut FILETIME, user: *mut FILETIME) -> i32;
    pub fn GlobalMemoryStatusEx(status: *mut MEMORYSTATUSEX) -> i32;
    pub fn GetDiskFreeSpaceExW(path: *const u16, free: *mut u64, total: *mut u64, total_free: *mut u64) -> i32;
    pub fn GetModuleFileNameW(module: *mut c_void, buffer: *mut u16, size: u32) -> u32;
}

#[link(name = "advapi32")]
extern "system" {
    pub fn RegOpenKeyExW(key: isize, sub_key: *const u16, options: u32, access: u32, result: *mut isize) -> i32;
    pub fn RegCloseKey(key: isize) -> i32;
    pub fn RegQueryValueExW(key: isize, value: *const u16, reserved: *mut u32, kind: *mut u32,
        data: *mut u8, size: *mut u32) -> i32;
    pub fn RegSetValueExW(key: isize, value: *const u16, reserved: u32, kind: u32,
        data: *const u8, size: u32) -> i32;
}

#[link(name = "pdh")]
extern "system" {
    pub fn PdhOpenQueryW(data: *const u16, user_data: isize, query: *mut isize) -> i32;
    pub fn PdhAddEnglishCounterW(query: isize, path: *const u16, detail: usize, counter: *mut isize) -> i32;
    pub fn PdhCollectQueryData(query: isize) -> i32;
    pub fn PdhGetFormattedCounterArrayW(counter: isize, format: u32, size: *mut u32,
        count: *mut u32, buffer: *mut PDH_FMT_COUNTERVALUE_ITEM_W) -> i32;
    pub fn PdhCloseQuery(query: isize) -> i32;
}

/// Convert a UTF-16 slice without trusting the caller to terminate it.
pub fn wide_string(slice: &[u16]) -> String {
    let end = slice.iter().position(|unit| *unit == 0).unwrap_or(slice.len());
    String::from_utf16_lossy(&slice[..end])
}

pub fn to_wide(value: &str) -> Vec<u16> {
    value.encode_utf16().chain(std::iter::once(0)).collect()
}
