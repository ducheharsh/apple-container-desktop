use std::process::Command;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::path::Path;
use tauri::{AppHandle, Emitter, Manager};
use tokio::process::Command as TokioCommand;
use tokio::io::{AsyncBufReadExt, BufReader};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogLine {
    pub timestamp: String,
    pub line: String,
    pub stream: String, // "stdout" or "stderr"
}

type ActiveStreams = Arc<Mutex<HashMap<String, bool>>>;

// Function to find the container CLI binary
fn find_container_cli() -> Result<String, String> {
    // Common installation paths for container CLI
    let paths = vec![
        "/usr/local/bin/container",
        "/opt/homebrew/bin/container",
        "/usr/bin/container",
        "container", // Fallback to PATH
    ];
    
    for path in paths {
        if path == "container" {
            // Try using PATH for the fallback
            match Command::new("which").arg("container").output() {
                Ok(output) if output.status.success() => {
                    let found_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if !found_path.is_empty() && Path::new(&found_path).exists() {
                        return Ok(found_path);
                    }
                }
                _ => continue,
            }
        } else {
            // Check direct path
            if Path::new(path).exists() {
                return Ok(path.to_string());
            }
        }
    }
    
    Err("Apple Container CLI not found. Please install it from https://github.com/apple/container/releases".to_string())
}

#[tauri::command]
async fn run_container_command(args: Vec<String>) -> Result<CommandResult, String> {
    let container_cli = find_container_cli()?;
    
    let output = Command::new(&container_cli)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    let result = CommandResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code(),
    };

    Ok(result)
}

#[tauri::command]
async fn run_container_command_with_stdin(args: Vec<String>, stdin: String) -> Result<CommandResult, String> {
    use std::process::Stdio;
    use std::io::Write;
    
    let container_cli = find_container_cli()?;

    let mut child = Command::new(&container_cli)
        .args(&args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn command: {}", e))?;

    if let Some(stdin_handle) = child.stdin.as_mut() {
        stdin_handle.write_all(stdin.as_bytes())
            .map_err(|e| format!("Failed to write to stdin: {}", e))?;
        stdin_handle.flush()
            .map_err(|e| format!("Failed to flush stdin: {}", e))?;
    }

    let output = child.wait_with_output()
        .map_err(|e| format!("Failed to wait for command: {}", e))?;

    let result = CommandResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code(),
    };

    Ok(result)
}

#[tauri::command]
async fn stream_container_logs(
    app_handle: AppHandle,
    container_name: String,
    follow: bool,
) -> Result<String, String> {
    let stream_id = format!("logs_{}", container_name);
    let active_streams: ActiveStreams = app_handle.state::<ActiveStreams>().inner().clone();
    
    // Mark stream as active
    {
        let mut streams = active_streams.lock().unwrap();
        streams.insert(stream_id.clone(), true);
    }

    let app_handle_clone = app_handle.clone();
    let container_name_clone = container_name.clone();
    let active_streams_clone = active_streams.clone();
    let stream_id_clone = stream_id.clone();

    tokio::spawn(async move {
        let mut args = vec!["logs".to_string()];
        if follow {
            args.push("--follow".to_string());
        }
        args.push(container_name_clone);

        let container_cli = match find_container_cli() {
            Ok(cli) => cli,
            Err(e) => {
                eprintln!("Failed to find container CLI: {}", e);
                return;
            }
        };

        let mut cmd = TokioCommand::new(&container_cli)
            .args(&args)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .expect("Failed to start container logs command");

        let stdout = cmd.stdout.take().expect("Failed to get stdout");
        let stderr = cmd.stderr.take().expect("Failed to get stderr");

        let stdout_reader = BufReader::new(stdout);
        let stderr_reader = BufReader::new(stderr);

        let mut stdout_lines = stdout_reader.lines();
        let mut stderr_lines = stderr_reader.lines();

        loop {
            // Check if stream should be stopped
            let should_stop = {
                let streams = active_streams_clone.lock().unwrap();
                !streams.get(&stream_id_clone).unwrap_or(&false)
            };
            if should_stop {
                let _ = cmd.kill().await;
                break;
            }

            tokio::select! {
                line = stdout_lines.next_line() => {
                    match line {
                        Ok(Some(line)) => {
                            let log_line = LogLine {
                                timestamp: chrono::Utc::now().to_rfc3339(),
                                line,
                                stream: "stdout".to_string(),
                            };
                            let _ = app_handle_clone.emit(&format!("container-log-{}", container_name), &log_line);
                        },
                        Ok(None) => break,
                        Err(_) => break,
                    }
                },
                line = stderr_lines.next_line() => {
                    match line {
                        Ok(Some(line)) => {
                            let log_line = LogLine {
                                timestamp: chrono::Utc::now().to_rfc3339(),
                                line,
                                stream: "stderr".to_string(),
                            };
                            let _ = app_handle_clone.emit(&format!("container-log-{}", container_name), &log_line);
                        },
                        Ok(None) => break,
                        Err(_) => break,
                    }
                }
            }
        }

        // Clean up
        {
            let mut streams = active_streams_clone.lock().unwrap();
            streams.remove(&stream_id_clone);
        }
    });

    Ok(stream_id)
}

#[tauri::command]
async fn stop_log_stream(app_handle: AppHandle, stream_id: String) -> Result<(), String> {
    let active_streams: ActiveStreams = app_handle.state::<ActiveStreams>().inner().clone();
    let mut streams = active_streams.lock().unwrap();
    streams.insert(stream_id, false);
    Ok(())
}

#[tauri::command]
async fn get_container_status() -> Result<Vec<serde_json::Value>, String> {
    let container_cli = find_container_cli()?;
    
    let output = Command::new(&container_cli)
        .args(&["ls", "-a", "--format", "json"])
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    // Apple Container CLI returns a JSON array, not newline-delimited JSON
    match serde_json::from_str::<Vec<serde_json::Value>>(&stdout) {
        Ok(containers) => Ok(containers),
        Err(e) => Err(format!("Failed to parse JSON: {}", e))
    }
}

#[tauri::command]
async fn check_container_cli() -> Result<serde_json::Value, String> {
    match find_container_cli() {
        Ok(cli_path) => {
            // Try to get version info
            match Command::new(&cli_path).arg("--version").output() {
                Ok(output) if output.status.success() => {
                    let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    Ok(serde_json::json!({
                        "available": true,
                        "path": cli_path,
                        "version": version,
                        "error": null
                    }))
                }
                Ok(output) => {
                    let error = String::from_utf8_lossy(&output.stderr).trim().to_string();
                    Ok(serde_json::json!({
                        "available": false,
                        "path": cli_path,
                        "version": null,
                        "error": format!("CLI found but not working: {}", error)
                    }))
                }
                Err(e) => {
                    Ok(serde_json::json!({
                        "available": false,
                        "path": cli_path,
                        "version": null,
                        "error": format!("Failed to execute CLI: {}", e)
                    }))
                }
            }
        }
        Err(e) => {
            Ok(serde_json::json!({
                "available": false,
                "path": null,
                "version": null,
                "error": e
            }))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let active_streams: ActiveStreams = Arc::new(Mutex::new(HashMap::new()));

    tauri::Builder::default()
        .manage(active_streams)
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            run_container_command,
            run_container_command_with_stdin,
            stream_container_logs,
            stop_log_stream,
            get_container_status,
            check_container_cli
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
