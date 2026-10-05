mod codex;
mod skills;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(codex::Running::default())
        .invoke_handler(tauri::generate_handler![
            codex::codex_status,
            codex::send_turn,
            codex::cancel_turn,
            skills::app_paths,
            skills::list_skills,
            skills::save_skill,
            skills::open_skills_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Eclipse Agent");
}
