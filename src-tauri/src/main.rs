// Desktop shell for the static web export. The whole app is the
// embedded `dist/` bundle served over tauri's custom protocol; there
// are no commands, no plugins, and no filesystem access yet.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Buffer transport for the WebKitGTK compositor. The DMA-BUF path
    // crashes on some NVIDIA proprietary driver combos ("Error 71"
    // during dispatch), so it stays off by default when that kernel
    // module is loaded; everything else runs the accelerated path.
    // BCP_DMABUF=1 forces it on and BCP_NO_DMABUF=1 forces the
    // shared-memory fallback regardless of hardware.
    //
    // Frame rate note, measured 2026-08 on a 144 Hz panel (nvidia
    // 610.57.04, webkitgtk 2.52.6): every path that actually renders
    // locks to exactly 60 fps with perfect pacing, because WebKitGTK
    // schedules its rendering updates at a fixed 60 Hz instead of
    // following the display. DMA-BUF would deliver display-driven
    // callbacks but crashes here (Error 71 under Wayland, permanently
    // grey window under XWayland), so shared memory is the only usable
    // transport and 60 fps is the ceiling for now. Nothing in the app
    // can lift this; retest with BCP_DMABUF=1 after a webkitgtk or
    // driver update. Windows (WebView2) and macOS (WKWebView) track
    // the display rate normally.
    #[cfg(target_os = "linux")]
    {
        let force_on = std::env::var("BCP_DMABUF").as_deref() == Ok("1");
        let force_off = std::env::var("BCP_NO_DMABUF").as_deref() == Ok("1");
        let nvidia = std::path::Path::new("/sys/module/nvidia").exists();
        if !force_on && (force_off || nvidia) {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    // WebKitGTK rasterizes through cairo/FreeType with the autohinter
    // forced on, which grid-fits round glyph bottoms onto the baseline
    // (o/e/O end in a flat bar; Chromium leaves the same outlines
    // untouched). @font-face families never go through fontconfig
    // family matching, so only an UNCONDITIONAL override reaches them;
    // scoping to a family name silently does nothing.
    #[cfg(target_os = "linux")]
    {
        let conf = std::env::temp_dir().join("bcp-fonts.conf");
        if std::fs::write(
            &conf,
            r#"<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
  <match target="font">
    <edit name="hinting" mode="assign">
      <bool>false</bool>
    </edit>
    <edit name="hintstyle" mode="assign">
      <const>hintnone</const>
    </edit>
  </match>
</fontconfig>
"#,
        )
        .is_ok()
        {
            std::env::set_var("FONTCONFIG_FILE", &conf);
        }
    }

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running the bcp desktop app")
}

