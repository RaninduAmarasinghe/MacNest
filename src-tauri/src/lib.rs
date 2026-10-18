use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
struct DetectedTool {
    name: String,
    installed: bool,
    version: Option<String>,
}

#[derive(Serialize)]
struct HomebrewPackage {
    name: String,
    version: String,
    package_type: String,
}

fn detect_tool(name: &str, executable: &str, args: &[&str]) -> DetectedTool {
    match Command::new(executable).args(args).output() {
        Ok(output) if output.status.success() => {
            let version = String::from_utf8_lossy(&output.stdout)
                .trim()
                .to_string();

            let version = if version.is_empty() {
                String::from_utf8_lossy(&output.stderr)
                    .trim()
                    .to_string()
            } else {
                version
            };

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

fn run_homebrew_command(args: &[&str]) -> Result<String, String> {
    let output = Command::new("brew")
        .args(args)
        .output()
        .map_err(|error| format!("Could not execute Homebrew: {error}"))?;

    if !output.status.success() {
        return Err(format!(
            "Homebrew command failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
fn get_homebrew_packages() -> Result<Vec<HomebrewPackage>, String> {
    let mut packages = Vec::new();

    // Read installed Homebrew formulae.
    let formula_output = run_homebrew_command(&[
        "list",
        "--formula",
        "--versions",
    ])?;

    for line in formula_output.lines() {
        let mut parts = line.split_whitespace();

        if let Some(name) = parts.next() {
            let versions = parts.collect::<Vec<_>>().join(", ");

            packages.push(HomebrewPackage {
                name: name.to_string(),
                version: if versions.is_empty() {
                    "Unknown".to_string()
                } else {
                    versions
                },
                package_type: "Formula".to_string(),
            });
        }
    }

    // Read installed Homebrew casks.
    let cask_output = run_homebrew_command(&[
        "list",
        "--cask",
        "--versions",
    ])?;

    for line in cask_output.lines() {
        let mut parts = line.split_whitespace();

        if let Some(name) = parts.next() {
            let versions = parts.collect::<Vec<_>>().join(", ");

            packages.push(HomebrewPackage {
                name: name.to_string(),
                version: if versions.is_empty() {
                    "Unknown".to_string()
                } else {
                    versions
                },
                package_type: "Cask".to_string(),
            });
        }
    }

    packages.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(packages)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            scan_development_tools,
            get_homebrew_packages
        ])
        .run(tauri::generate_context!())
        .expect("Failed to run MacNest");
}