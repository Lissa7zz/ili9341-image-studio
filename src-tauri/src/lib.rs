use base64::{engine::general_purpose::STANDARD, Engine as _};
use std::path::Path;

#[tauri::command]
fn save_file(default_name: String, base64_data: String) -> Result<bool, String> {
    let bytes = STANDARD
        .decode(base64_data)
        .map_err(|error| format!("Invalid file data: {error}"))?;

    let mut dialog = rfd::FileDialog::new().set_file_name(&default_name);
    dialog = match Path::new(&default_name)
        .extension()
        .and_then(|extension| extension.to_str())
    {
        Some("zip") => dialog.add_filter("ZIP archive", &["zip"]),
        Some("bin") => dialog.add_filter("RGB565 binary", &["bin"]),
        Some("ico") => dialog.add_filter("Windows icon", &["ico"]),
        _ => dialog,
    };

    let Some(path) = dialog.save_file() else {
        return Ok(false);
    };

    std::fs::write(path, bytes)
        .map(|()| true)
        .map_err(|error| format!("Unable to save file: {error}"))
}

#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    const ALLOWED_PREFIXES: [&str; 3] = [
        "https://github.com/Lissa7zz/ili9341-image-studio",
        "https://lissa7zz.github.io/ili9341-image-studio/",
        "https://www.st.com/",
    ];

    if !ALLOWED_PREFIXES
        .iter()
        .any(|prefix| url.starts_with(prefix))
    {
        return Err("Blocked external URL".to_string());
    }

    open::that_detached(url).map_err(|error| format!("Unable to open URL: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_file, open_external])
        .run(tauri::generate_context!())
        .expect("error while running Pixel2Panel");
}
