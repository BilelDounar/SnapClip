mod capture;
mod input;
mod ocr;

use serde::Serialize;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, WindowEvent};

#[derive(Serialize)]
pub struct CaptureResult {
    ocr: ocr::OcrResult,
    bounds: capture::WindowBounds,
}

/// Captures the focused window and runs OCR on it.
#[tauri::command]
fn capture_active_window() -> Result<CaptureResult, String> {
    let (image, bounds) = capture::capture_focused_window()?;
    let ocr = ocr::recognize(&image)?;
    Ok(CaptureResult { ocr, bounds })
}

/// Pastes the clipboard at the current cursor position.
#[tauri::command]
fn paste_at_cursor() -> Result<(), String> {
    input::paste_at_cursor()
}

#[tauri::command]
fn show_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        window.show().map_err(|e| e.to_string())?;
        let _ = window.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn hide_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn show_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn build_tray(app: &tauri::App) -> tauri::Result<()> {
    let capture_item =
        MenuItem::with_id(app, "capture", "Armer la capture", true, None::<&str>)?;
    let show_item =
        MenuItem::with_id(app, "show", "Afficher SnapClip", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quitter", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[
            &capture_item,
            &PredefinedMenuItem::separator(app)?,
            &show_item,
            &quit_item,
        ],
    )?;

    TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("SnapClip")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "capture" => {
                let _ = app.emit("arm-capture", ());
            }
            "show" => show_main(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            input::spawn_gesture_listener(app.handle().clone());
            build_tray(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing the main window keeps SnapClip alive in the tray.
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            capture_active_window,
            paste_at_cursor,
            show_overlay,
            hide_overlay
        ])
        .run(tauri::generate_context!())
        .expect("error while running SnapClip");
}
