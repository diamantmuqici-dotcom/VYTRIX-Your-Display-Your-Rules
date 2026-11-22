fn main() {
    tauri_build::build();

    // The unit-test harness has no activation manifest, so the comctl32 v6
    // TaskDialogIndirect import from Tauri's dialog backend fails at loader
    // time. Delay-loading defers that symbol until a dialog is actually shown;
    // the shipped app resolves it through its embedded manifest.
    #[cfg(windows)]
    {
        println!("cargo:rustc-link-arg=/DELAYLOAD:comctl32.dll");
        println!("cargo:rustc-link-lib=delayimp");
    }
}
