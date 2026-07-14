use std::time::{Duration, Instant};

use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use tauri::{AppHandle, Emitter};

const DOUBLE_CLICK_INTERVAL: Duration = Duration::from_millis(500);
const LONG_CLICK_THRESHOLD: Duration = Duration::from_millis(600);

/// Pastes the clipboard at the current cursor position by simulating the
/// platform paste shortcut (Cmd+V on macOS, Ctrl+V elsewhere).
pub fn paste_at_cursor() -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    let modifier = Key::Meta;
    #[cfg(not(target_os = "macos"))]
    let modifier = Key::Control;

    enigo
        .key(modifier, Direction::Press)
        .map_err(|e| e.to_string())?;
    enigo
        .key(Key::Unicode('v'), Direction::Click)
        .map_err(|e| e.to_string())?;
    enigo
        .key(modifier, Direction::Release)
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Spawns a background thread that listens to global mouse events and emits
/// `mouse-gesture` events ("double-right-click" / "long-right-click") so the
/// UI can trigger a paste — keeping the whole flow mouse-driven.
pub fn spawn_gesture_listener(app: AppHandle) {
    std::thread::spawn(move || {
        let mut last_right_down: Option<Instant> = None;
        let mut last_right_up: Option<Instant> = None;

        let callback = move |event: rdev::Event| {
            match event.event_type {
                rdev::EventType::ButtonPress(rdev::Button::Right) => {
                    let now = Instant::now();
                    if let Some(prev) = last_right_up {
                        if now.duration_since(prev) <= DOUBLE_CLICK_INTERVAL {
                            let _ = app.emit("mouse-gesture", "double-right-click");
                        }
                    }
                    last_right_down = Some(now);
                }
                rdev::EventType::ButtonRelease(rdev::Button::Right) => {
                    let now = Instant::now();
                    if let Some(down) = last_right_down {
                        if now.duration_since(down) >= LONG_CLICK_THRESHOLD {
                            let _ = app.emit("mouse-gesture", "long-right-click");
                        }
                    }
                    last_right_up = Some(now);
                }
                _ => {}
            }
        };

        if let Err(err) = rdev::listen(callback) {
            eprintln!("global mouse listener stopped: {err:?}");
        }
    });
}
