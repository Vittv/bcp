// Desktop shell for the static web export. The whole app is the
// embedded `dist/` bundle served over tauri's custom protocol; the
// only command is the rootless linux updater described below.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::atomic::{AtomicBool, Ordering};

use tauri::Manager;

// set while the rootless installer runs; the banner and the settings
// section use separate hook instances, so both could be pressed at once
// without a guard. second trigger bails out instead of racing two mv's.
static UPDATE_IN_PROGRESS: AtomicBool = AtomicBool::new(false);

// the webview profile caches the embedded bundle, and on windows the pwa
// worker registers inside the shell because tauri serves
// http://tauri.localhost there. a stale worker keeps serving the previous
// bundle, so once per released version the sweep below clears the profile's
// origin data and reloads: the fresh bundle renders and the next update
// check runs against a clean profile. the ui reports the binary version
// (useAppVersion) so the shown version always matches what the updater
// compares.
static WEBVIEW_SWEPT: AtomicBool = AtomicBool::new(false);

const SWEEP_STALE_WEBVIEW_JS: &str = r#"
(async () => {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    const keys = await caches.keys();
    await Promise.all(regs.map((r) => r.unregister()));
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch (_) {}
  location.reload();
})();
"#;

fn sweep_stale_webview(webview: &tauri::Webview) {
    if WEBVIEW_SWEPT.swap(true, Ordering::SeqCst) {
        return;
    }
    let version = webview.package_info().version.to_string();
    let Some(data_dir) = webview.path().app_data_dir().ok() else { return };
    let marker = data_dir.join("webview-sweep");
    if std::fs::read_to_string(&marker).map(|s| s == version).unwrap_or(false) {
        return;
    }
    // clears the whole webview2 profile (service worker, caches, http cache)
    // in one call; only windows ever registered the stale worker
    #[cfg(target_os = "windows")]
    let _ = webview.clear_all_browsing_data();
    // unregister workers and drop caches in-page, awaiting both, then reload
    // once so the fresh embedded bundle renders without a stale worker and
    // the next install from inside the app computes against a clean profile
    let _ = webview.eval(SWEEP_STALE_WEBVIEW_JS);
    if let Some(parent) = marker.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let _ = std::fs::write(marker, version);
}

// Rootless linux updater. bcp installs per-user via scripts/install-linux.sh
// (binary lives in ~/.local/share/bcp), which the tauri updater cannot reach,
// since it writes through system deb/rpm. when the app notices a newer
// version there, it re-runs that installer for the target version and then
// relaunches into the fresh binary itself, because tauri's restart cannot:
// once the running executable file is replaced, current_exe resolves to
// "... (deleted)" and the respawn would fail. version is trusted input (it
// comes from our own latest.json), but it still flows in as an env var so no
// part of it ever reaches a shell grammar position.
#[tauri::command]
fn run_rootless_update(app: tauri::AppHandle, version: String) -> Result<(), String> {
    if UPDATE_IN_PROGRESS.swap(true, Ordering::SeqCst) {
        return Err(String::from("an update is already installing"));
    }
    let result = run_rootless_update_inner(app, version);
    UPDATE_IN_PROGRESS.store(false, Ordering::SeqCst);
    result
}

#[cfg(not(target_os = "linux"))]
fn run_rootless_update_inner(_app: tauri::AppHandle, _version: String) -> Result<(), String> {
    Err(String::from("rootless updates only apply to linux installs"))
}

// blocking on purpose: .output() waits for the whole curl|bash pipeline to
// finish, so the fresh binary is only spawned after the install completed.
#[cfg(target_os = "linux")]
fn run_rootless_update_inner(app: tauri::AppHandle, version: String) -> Result<(), String> {
    run_rootless_update_linux(&app, version)
}

#[cfg(target_os = "linux")]
fn run_rootless_update_linux(app: &tauri::AppHandle, version: String) -> Result<(), String> {
    let script = "https://raw.githubusercontent.com/Vittv/bcp/main/scripts/install-linux.sh";
    let cmd = format!("curl -LsS {script} | bash -s -- --version \"$BCP_UPDATE_VERSION\"");
    let output = std::process::Command::new("bash")
        .arg("-c")
        .arg(cmd)
        .env("BCP_UPDATE_VERSION", version)
        .output()
        .map_err(|err| format!("could not start the installer: {err}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let tail: String = stderr.chars().rev().take(300).collect::<String>().chars().rev().collect();
        return Err(format!("installer failed: {tail}"));
    }
    let home = std::env::var("HOME")
        .map_err(|_| String::from("install succeeded but HOME is not set"))?;
    let new_binary = std::path::Path::new(&home)
        .join(".local")
        .join("share")
        .join("bcp")
        .join("bcp");
    let args: Vec<String> = std::env::args().skip(1).collect();
    std::process::Command::new(&new_binary)
        .args(&args)
        .spawn()
        .map_err(|err| format!("install succeeded but could not relaunch: {err}"))?;
    app.exit(0);
    Ok(())
}

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
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![run_rootless_update])
        .on_page_load(|webview, payload| {
            if payload.event() == tauri::webview::PageLoadEvent::Finished {
                sweep_stale_webview(webview);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running the bcp desktop app")
}

