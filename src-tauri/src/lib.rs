use serde::{Deserialize, Serialize};
use std::process::Command;

// Check common Homebrew prefixes before relying on the app's PATH. GUI apps
// often inherit a much smaller PATH than shells do.
fn homebrew_path() -> &'static str {
    ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"]
        .into_iter()
        .find(|path| std::path::Path::new(path).is_file())
        .unwrap_or("brew")
}

// Development tools detected on the Mac.
#[derive(Serialize)]
struct DetectedTool {
    name: String,
    installed: bool,
    version: Option<String>,
}

// Packages installed through Homebrew.
#[derive(Serialize)]
struct HomebrewPackage {
    name: String,
    version: String,
    package_type: String,
}

#[derive(Serialize)]
struct OutdatedPackage {
    name: String,
    package_type: String,
    installed_version: String,
    available_version: String,
}

#[derive(Deserialize)]
struct HomebrewOutdatedList {
    #[serde(default)]
    formulae: Vec<HomebrewOutdatedEntry>,
    #[serde(default)]
    casks: Vec<HomebrewOutdatedEntry>,
}

#[derive(Deserialize)]
struct HomebrewOutdatedEntry {
    name: String,
    #[serde(default)]
    installed_versions: Vec<String>,
    current_version: String,
}

// Packages returned by Homebrew search.
#[derive(Serialize)]
struct AvailablePackage {
    name: String,
    package_type: String,
}

// Detect an installed development tool.
fn detect_tool(name: &str, executable: &str, args: &[&str]) -> DetectedTool {
    match Command::new(executable).args(args).output() {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout)
                .trim()
                .to_string();

            let version = if stdout.is_empty() {
                String::from_utf8_lossy(&output.stderr)
                    .trim()
                    .to_string()
            } else {
                stdout
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

// Scan development tools.
#[tauri::command]
async fn scan_development_tools() -> Result<Vec<DetectedTool>, String> {
    tauri::async_runtime::spawn_blocking(scan_development_tools_blocking)
        .await
        .map_err(|error| format!("Development tool scan failed: {}", error))
}

fn scan_development_tools_blocking() -> Vec<DetectedTool> {
    vec![
        detect_tool("Git", "git", &["--version"]),
        detect_tool("Node.js", "node", &["--version"]),
        detect_tool("npm", "npm", &["--version"]),
        detect_tool("Python", "python3", &["--version"]),
        detect_tool("Rust", "rustc", &["--version"]),
        detect_tool("Cargo", "cargo", &["--version"]),
        detect_tool("Homebrew", homebrew_path(), &["--version"]),
    ]
}

// Execute a Homebrew command and return its output.
fn run_homebrew_command(args: &[&str]) -> Result<String, String> {
    let executable = homebrew_path();
    let output = Command::new(executable)
        .args(args)
        .output()
        .map_err(|error| {
            format!(
                "Could not execute Homebrew at {}: {}",
                executable, error
            )
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr)
            .trim()
            .to_string();

        let stdout = String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string();

        let message = if !stderr.is_empty() {
            stderr
        } else if !stdout.is_empty() {
            stdout
        } else {
            format!(
                "Homebrew command failed with exit status: {}",
                output.status
            )
        };

        return Err(message);
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

// Search returns a nonzero exit status when a category has no matches. Keep
// that separate from genuine Homebrew errors so results from the other
// category are still available.
fn run_homebrew_search(args: &[&str]) -> Result<String, String> {
    let executable = homebrew_path();
    let output = Command::new(executable)
        .args(args)
        .output()
        .map_err(|error| {
            format!("Could not execute Homebrew at {}: {}", executable, error)
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if output.status.success() {
        return Ok(stdout);
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let message = if stderr.is_empty() {
        stdout
    } else if stdout.is_empty() {
        stderr
    } else {
        format!("{}\n{}", stderr, stdout)
    };

    let normalized = message.to_lowercase();
    if normalized.contains("no formulae or casks found")
        || normalized.contains("no formulae found")
        || normalized.contains("no casks found")
    {
        return Ok(String::new());
    }

    if message.is_empty() {
        return Err(format!("Homebrew search failed with exit status: {}", output.status));
    }

    Err(message)
}

// Validate a Homebrew package name and type.
fn validate_package(name: &str, package_type: &str) -> Result<(), String> {
    if package_type != "Formula" && package_type != "Cask" {
        return Err("Invalid package type. Use Formula or Cask.".to_string());
    }

    if name.is_empty()
        || name.len() > 100
        || !name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || "-_@./".contains(c))
        || name.starts_with('-')
        || name.contains("..")
    {
        return Err("Invalid Homebrew package name.".to_string());
    }

    Ok(())
}

// List installed Homebrew formulae and casks.
#[tauri::command]
async fn get_homebrew_packages() -> Result<Vec<HomebrewPackage>, String> {
    tauri::async_runtime::spawn_blocking(get_homebrew_packages_blocking)
        .await
        .map_err(|error| format!("Homebrew inventory task failed: {}", error))?
}

fn get_homebrew_packages_blocking() -> Result<Vec<HomebrewPackage>, String> {
    let mut packages = Vec::new();

    // Get installed formulae.
    let formula_output =
        run_homebrew_command(&["list", "--formula", "--versions"])?;

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

    // Get installed casks.
    let cask_output =
        run_homebrew_command(&["list", "--cask", "--versions"])?;

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

    // Sort packages alphabetically.
    packages.sort_by(|a, b| {
        a.name
            .to_lowercase()
            .cmp(&b.name.to_lowercase())
    });

    Ok(packages)
}

#[tauri::command]
async fn get_outdated_homebrew_packages() -> Result<Vec<OutdatedPackage>, String> {
    tauri::async_runtime::spawn_blocking(get_outdated_homebrew_packages_blocking)
        .await
        .map_err(|error| format!("Outdated package check failed: {}", error))?
}

fn get_outdated_homebrew_packages_blocking() -> Result<Vec<OutdatedPackage>, String> {
    let output = run_homebrew_command(&["outdated", "--json=v2"])?;
    let mut outdated: HomebrewOutdatedList = serde_json::from_str(&output)
        .map_err(|error| format!("Could not read Homebrew outdated list: {}", error))?;
    let mut packages = Vec::with_capacity(outdated.formulae.len() + outdated.casks.len());

    packages.extend(outdated.formulae.drain(..).map(|package| OutdatedPackage {
        name: package.name,
        package_type: "Formula".to_string(),
        installed_version: package.installed_versions.join(", "),
        available_version: package.current_version,
    }));

    packages.extend(outdated.casks.drain(..).map(|package| OutdatedPackage {
        name: package.name,
        package_type: "Cask".to_string(),
        installed_version: package.installed_versions.join(", "),
        available_version: package.current_version,
    }));

    packages.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(packages)
}

// Install a Homebrew formula or cask.
#[tauri::command]
async fn install_homebrew_package(
    name: String,
    package_type: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        install_homebrew_package_blocking(name, package_type)
    })
    .await
    .map_err(|error| format!("Homebrew installation task failed: {}", error))?
}

fn install_homebrew_package_blocking(
    name: String,
    package_type: String,
) -> Result<String, String> {
    validate_package(&name, &package_type)?;

    let args = if package_type == "Cask" {
        vec!["install", "--cask", name.as_str()]
    } else {
        vec!["install", "--formula", name.as_str()]
    };

    let output = Command::new(homebrew_path())
        .args(&args)
        .output()
        .map_err(|error| {
            format!("Could not execute Homebrew: {}", error)
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr)
            .trim()
            .to_string();

        let stdout = String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string();

        let message = if !stderr.is_empty() {
            stderr
        } else if !stdout.is_empty() {
            stdout
        } else {
            format!(
                "Homebrew installation failed with exit status: {}",
                output.status
            )
        };

        return Err(message);
    }

    Ok(format!("Successfully installed {}.", name))
}

// Uninstall a Homebrew formula or cask.
#[tauri::command]
async fn uninstall_homebrew_package(
    name: String,
    package_type: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        uninstall_homebrew_package_blocking(name, package_type)
    })
    .await
    .map_err(|error| format!("Homebrew removal task failed: {}", error))?
}

fn uninstall_homebrew_package_blocking(
    name: String,
    package_type: String,
) -> Result<String, String> {
    validate_package(&name, &package_type)?;

    let args = if package_type == "Cask" {
        vec!["uninstall", "--cask", name.as_str()]
    } else {
        vec!["uninstall", "--formula", name.as_str()]
    };

    let output = Command::new(homebrew_path())
        .args(&args)
        .output()
        .map_err(|error| {
            format!("Could not execute Homebrew: {}", error)
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr)
            .trim()
            .to_string();

        let stdout = String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string();

        let message = if !stderr.is_empty() {
            stderr
        } else if !stdout.is_empty() {
            stdout
        } else {
            format!(
                "Homebrew uninstallation failed with exit status: {}",
                output.status
            )
        };

        return Err(message);
    }

    Ok(format!("Successfully uninstalled {}.", name))
}

#[tauri::command]
async fn update_homebrew_package(
    name: String,
    package_type: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        update_homebrew_package_blocking(name, package_type)
    })
    .await
    .map_err(|error| format!("Homebrew update task failed: {}", error))?
}

fn update_homebrew_package_blocking(
    name: String,
    package_type: String,
) -> Result<String, String> {
    validate_package(&name, &package_type)?;

    let args = if package_type == "Cask" {
        vec!["upgrade", "--cask", name.as_str()]
    } else {
        vec!["upgrade", "--formula", name.as_str()]
    };

    run_homebrew_command(&args)?;
    Ok(format!("Successfully updated {}.", name))
}

#[tauri::command]
async fn update_all_homebrew_packages() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(update_all_homebrew_packages_blocking)
        .await
        .map_err(|error| format!("Homebrew update task failed: {}", error))?
}

fn update_all_homebrew_packages_blocking() -> Result<String, String> {
    run_homebrew_command(&["upgrade"])?;
    Ok("All outdated Homebrew packages have been updated.".to_string())
}

// Search available Homebrew formulae and casks.
#[tauri::command]
async fn search_homebrew_packages(
    query: String,
) -> Result<Vec<AvailablePackage>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        search_homebrew_packages_blocking(query)
    })
    .await
    .map_err(|error| format!("Homebrew search task failed: {}", error))?
}

fn search_homebrew_packages_blocking(
    query: String,
) -> Result<Vec<AvailablePackage>, String> {
    let query = query.trim();

    if query.is_empty() {
        return Ok(Vec::new());
    }

    // Search formulae.
    let formula_output =
        run_homebrew_search(&["search", "--formula", query])?;

    let mut packages: Vec<AvailablePackage> = formula_output
        .lines()
        .map(str::trim)
        .filter(|name| !name.is_empty())
        .map(|name| AvailablePackage {
            name: name.to_string(),
            package_type: "Formula".to_string(),
        })
        .collect();

    // Search casks.
    let cask_output =
        run_homebrew_search(&["search", "--cask", query])?;

    for name in cask_output
        .lines()
        .map(str::trim)
        .filter(|name| !name.is_empty())
    {
        packages.push(AvailablePackage {
            name: name.to_string(),
            package_type: "Cask".to_string(),
        });
    }

    // Sort and remove duplicate results.
    packages.sort_by(|a, b| {
        a.name
            .to_lowercase()
            .cmp(&b.name.to_lowercase())
    });

    packages.dedup_by(|a, b| {
        a.name == b.name && a.package_type == b.package_type
    });

    Ok(packages)
}

// Register Tauri commands.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            scan_development_tools,
            get_homebrew_packages,
            get_outdated_homebrew_packages,
            search_homebrew_packages,
            install_homebrew_package,
            uninstall_homebrew_package,
            update_homebrew_package,
            update_all_homebrew_packages
        ])
        .run(tauri::generate_context!())
        .expect("Failed to run MacNest");
}
