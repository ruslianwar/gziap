use sha2::{Digest, Sha256};
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![
        get_device_fingerprint,
        get_device_name
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn get_device_fingerprint() -> Result<String, String> {
    // 1. Ambil Hardware ID (UUID unik OS)
    let machine_id = machine_uid::get()
        .unwrap_or_else(|_| "UNKNOWN_MACHINE_ID".to_string());
    
    // 2. Ambil username OS jika bisa
    let username = std::env::var("USERNAME")
        .or_else(|_| std::env::var("USER"))
        .unwrap_or_else(|_| "UNKNOWN_USER".to_string());
        
    // Kombinasi
    let combined = format!("{}-{}", username, machine_id);
    
    // Hash kombinasi menggunakan SHA256 agar privasi UUID mentah tidak terbaca langsung
    let mut hasher = Sha256::new();
    hasher.update(combined.as_bytes());
    let result = hasher.finalize();
    
    Ok(format!("{:x}", result))
}

#[tauri::command]
fn get_device_name() -> Result<String, String> {
    let hostname = std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "Unknown-PC".to_string());
        
    Ok(hostname)
}
