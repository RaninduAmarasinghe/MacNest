use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
struct DetectedTool {
    name: String,
    installed: bool,
    version: Option<String>,
}

fn detect_tool(name: &str, executable: &str, args: &[&str]) -> DetectedTool {
    match Command::new(executable).args(args).output() {
        Ok(output) if output.status.success() => {
            let version = String::from_utf8_lossy(&output.stdout)
                .trim()
                .to_string();

            DetectedTool {
                name: name.to_string(),
                installed: true,
                version: Some(version),
            }
        }
        _ => DetectedTool {
            name: name.to_string(),
            installed: false,
            version: None,
        },
    }
}

#[tauri::command]
fn scan_development_tools() -> Vec<DetectedTool> {
    vec![
        detect_tool("Git", "git", &["--version"]),
        detect_tool("Node.js", "node", &["--version"]),
        detect_tool("npm", "npm", &["--version"]),
        detect_tool("Python", "python3", &["--version"]),
        detect_tool("Rust", "rustc", &["--version"]),
        detect_tool("Cargo", "cargo", &["--version"]),
        detect_tool("Homebrew", "brew", &["--version"]),
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            scan_development_tools
        ])
        .run(tauri::generate_context!())
        .expect("Failed to run MacNest");
}