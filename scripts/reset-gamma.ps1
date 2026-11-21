# VYTRIX gamma escape hatch.
# Writes a canonical linear ramp to every attached display using the documented
# Win32 SetDeviceGammaRamp API. Run this if a crashed session left a color tint.
# Usage: powershell -ExecutionPolicy Bypass -File reset-gamma.ps1

$ErrorActionPreference = "Stop"

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class VyGamma {
    [StructLayout(LayoutKind.Sequential)]
    public struct Ramp {
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)] public ushort[] Red;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)] public ushort[] Green;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)] public ushort[] Blue;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct DisplayDevice {
        public int cb;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string DeviceName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string DeviceString;
        public int StateFlags;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string DeviceID;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string DeviceKey;
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool EnumDisplayDevices(string lpDevice, uint iDevNum,
        ref DisplayDevice lpDisplayDevice, uint dwFlags);

    [DllImport("gdi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern IntPtr CreateDC(string lpszDriver, string lpszDevice,
        string lpszOutput, IntPtr lpInitData);

    [DllImport("gdi32.dll", SetLastError = true)]
    public static extern bool SetDeviceGammaRamp(IntPtr hDC, ref Ramp lpRamp);

    [DllImport("gdi32.dll", SetLastError = true)]
    public static extern bool DeleteDC(IntPtr hDC);
}

public static class VyGammaRun {
    // DISPLAY_DEVICE_ATTACHED_TO_DESKTOP = 0x00000001
    private const int AttachedToDesktop = 0x00000001;

    public static int Reset() {
        var ramp = new VyGamma.Ramp {
            Red = new ushort[256],
            Green = new ushort[256],
            Blue = new ushort[256],
        };
        for (int i = 0; i < 256; i++) {
            ushort value = (ushort)Math.Round(i / 255.0 * 65535.0);
            ramp.Red[i] = value;
            ramp.Green[i] = value;
            ramp.Blue[i] = value;
        }

        int written = 0;
        for (uint index = 0; ; index++) {
            var device = new VyGamma.DisplayDevice();
            device.cb = Marshal.SizeOf(device);
            if (!VyGamma.EnumDisplayDevices(null, index, ref device, 0)) break;
            if ((device.StateFlags & AttachedToDesktop) == 0) continue;

            IntPtr dc = VyGamma.CreateDC("DISPLAY", device.DeviceName, null, IntPtr.Zero);
            if (dc == IntPtr.Zero) continue;
            if (VyGamma.SetDeviceGammaRamp(dc, ref ramp)) written++;
            VyGamma.DeleteDC(dc);
        }
        return written;
    }
}
'@

$count = [VyGammaRun]::Reset()
if ($count -eq 0) {
    Write-Host "VYTRIX: no writable display ramp found."
    exit 1
}
Write-Host "VYTRIX: linear gamma ramp written to $count display(s)."
