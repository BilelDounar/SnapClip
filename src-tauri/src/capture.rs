use image::DynamicImage;
use serde::Serialize;
use xcap::Window;

#[derive(Serialize, Clone, Copy)]
pub struct WindowBounds {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

/// Finds the currently focused top-level window and returns a screenshot of it
/// together with its on-screen bounds.
pub fn capture_focused_window() -> Result<(DynamicImage, WindowBounds), String> {
    let windows = Window::all().map_err(|e| format!("window enumeration failed: {e}"))?;

    let target = windows
        .iter()
        .find(|w| w.is_focused().unwrap_or(false) && !w.is_minimized().unwrap_or(false))
        .or_else(|| {
            windows
                .iter()
                .find(|w| !w.is_minimized().unwrap_or(false))
        })
        .ok_or_else(|| "no capturable window found".to_string())?;

    let bounds = WindowBounds {
        x: target.x().unwrap_or(0),
        y: target.y().unwrap_or(0),
        width: target.width().unwrap_or(0) as i32,
        height: target.height().unwrap_or(0) as i32,
    };

    let rgba = target
        .capture_image()
        .map_err(|e| format!("window capture failed: {e}"))?;

    Ok((DynamicImage::ImageRgba8(rgba), bounds))
}
