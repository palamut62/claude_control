use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use serde::Serialize;
use std::{
  io::{Read, Write},
  path::{Path, PathBuf},
  process::Command,
  sync::{
    atomic::{AtomicU64, Ordering},
    Arc, Mutex,
  },
  thread,
};
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use tauri::{Emitter, Manager, State};

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn hide_console(command: &mut Command) {
  #[cfg(windows)]
  command.creation_flags(CREATE_NO_WINDOW);
}

struct ClaudeSession {
  writer: Box<dyn Write + Send>,
  child: Box<dyn Child + Send + Sync>,
  master: Box<dyn MasterPty + Send>,
}

#[derive(Default)]
struct AppState {
  session: Mutex<Option<ClaudeSession>>,
  active_session_id: Arc<AtomicU64>,
  next_session_id: AtomicU64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SystemInfo {
  claude_path: Option<String>,
  claude_version: Option<String>,
  git_available: bool,
  active_cli: bool,
}

#[derive(Default, Serialize)]
#[serde(rename_all = "camelCase")]
struct UsageMetrics {
  context: Option<f64>,
  five_hour: Option<f64>,
  weekly: Option<f64>,
}

fn usage_data_path() -> PathBuf {
  std::env::temp_dir().join("claudedeck-usage-cli.json")
}

fn notify_data_path() -> PathBuf {
  std::env::temp_dir().join("claudedeck-notify-cli.json")
}

fn prepare_usage_capture() -> Result<PathBuf, String> {
  let directory = std::env::temp_dir().join("claudedeck");
  std::fs::create_dir_all(&directory).map_err(|error| format!("Unable to create usage tracking folder: {error}"))?;
  let script_path = directory.join("capture-cli.ps1");
  let settings_path = directory.join("settings-cli.json");
  let data_path = usage_data_path();
  let escaped_data_path = data_path.to_string_lossy().replace('\'', "''");
  let script = format!(
    "$payload = [Console]::In.ReadToEnd()\n[IO.File]::WriteAllText('{}', $payload, [Text.UTF8Encoding]::new($false))\n",
    escaped_data_path
  );
  std::fs::write(&script_path, script).map_err(|error| format!("Unable to write usage tracker: {error}"))?;
  let command = format!(
    "powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File \"{}\"",
    script_path.to_string_lossy()
  );
  let notify_script_path = directory.join("notify-cli.ps1");
  let notify_data_path = notify_data_path();
  let escaped_notify_data_path = notify_data_path.to_string_lossy().replace('\'', "''");
  let notify_script = format!(
    "$payload = [Console]::In.ReadToEnd()\n[IO.File]::WriteAllText('{}', $payload, [Text.UTF8Encoding]::new($false))\n",
    escaped_notify_data_path
  );
  std::fs::write(&notify_script_path, notify_script).map_err(|error| format!("Unable to write notification tracker: {error}"))?;
  let notify_command = format!(
    "powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File \"{}\"",
    notify_script_path.to_string_lossy()
  );
  let settings = serde_json::json!({
    "statusLine": { "type": "command", "command": command, "padding": 0, "refreshInterval": 2 },
    "hooks": { "Notification": [ { "hooks": [ { "type": "command", "command": notify_command } ] } ] }
  });
  std::fs::write(&settings_path, settings.to_string()).map_err(|error| format!("Unable to write usage settings: {error}"))?;
  Ok(settings_path)
}

#[tauri::command]
fn get_usage_metrics() -> UsageMetrics {
  let Ok(raw) = std::fs::read_to_string(usage_data_path()) else { return UsageMetrics::default() };
  let Ok(value) = serde_json::from_str::<serde_json::Value>(&raw) else { return UsageMetrics::default() };
  UsageMetrics {
    context: value.pointer("/context_window/used_percentage").and_then(|item| item.as_f64()),
    five_hour: value.pointer("/rate_limits/five_hour/used_percentage").and_then(|item| item.as_f64()),
    weekly: value.pointer("/rate_limits/seven_day/used_percentage").and_then(|item| item.as_f64()),
  }
}

#[tauri::command]
fn get_notification() -> Option<String> {
  let path = notify_data_path();
  let raw = std::fs::read_to_string(&path).ok()?;
  let _ = std::fs::remove_file(&path);
  let value = serde_json::from_str::<serde_json::Value>(&raw).ok()?;
  value.pointer("/message").and_then(|item| item.as_str()).map(|text| text.to_string())
}

fn command_output(program: &str, args: &[&str], cwd: Option<&Path>) -> Option<String> {
  let mut command = Command::new(program);
  hide_console(&mut command);
  command.args(args);
  if let Some(path) = cwd {
    command.current_dir(path);
  }
  let output = command.output().ok()?;
  let text = if output.stdout.is_empty() { output.stderr } else { output.stdout };
  let value = String::from_utf8_lossy(&text).trim().to_string();
  (!value.is_empty()).then_some(value)
}

fn find_claude() -> Option<PathBuf> {
  command_output("where.exe", &["claude.cmd"], None)
    .or_else(|| command_output("where.exe", &["claude"], None))
    .and_then(|result| result.lines().next().map(PathBuf::from))
}

fn active_claude_processes() -> bool {
  let script = "Get-CimInstance Win32_Process | Where-Object { $_.Name -in @('claude.exe','node.exe','cmd.exe') } | Select-Object -ExpandProperty CommandLine";
  let snapshot = command_output("powershell.exe", &["-NoProfile", "-NonInteractive", "-Command", script], None)
    .unwrap_or_default().to_ascii_lowercase();
  snapshot.contains("@anthropic-ai\\claude-code") || snapshot.contains("npm\\claude.cmd")
}

fn read_system_info() -> SystemInfo {
  let claude = find_claude();
  let claude_version = claude.as_ref().and_then(|path| {
    if path.extension().is_some_and(|extension| extension.eq_ignore_ascii_case("cmd")) {
      command_output("cmd.exe", &["/d", "/c", path.to_string_lossy().as_ref(), "--version"], None)
    } else {
      command_output(path.to_string_lossy().as_ref(), &["--version"], None)
    }
  });
  let active_cli = active_claude_processes();
  SystemInfo {
    claude_path: claude.map(|path| path.to_string_lossy().into_owned()),
    claude_version,
    git_available: command_output("git", &["--version"], None).is_some(),
    active_cli,
  }
}

#[tauri::command]
fn get_windows_build() -> u32 {
  let mut command = Command::new("cmd");
  hide_console(&mut command);
  command.args(["/d", "/c", "ver"]);
  command.output().ok()
    .and_then(|output| String::from_utf8(output.stdout).ok())
    .and_then(|text| text.split('.').nth(2).and_then(|build| build.trim().parse::<u32>().ok()))
    .unwrap_or(22621)
}

#[tauri::command]
async fn get_system_info() -> Result<SystemInfo, String> {
  tauri::async_runtime::spawn_blocking(read_system_info)
    .await
    .map_err(|error| format!("Unable to read system information: {error}"))
}

#[tauri::command]
fn update_claude() -> Result<String, String> {
  let claude = find_claude().ok_or_else(|| "Claude Code CLI was not found.".to_string())?;
  let output = if claude.extension().is_some_and(|extension| extension.eq_ignore_ascii_case("cmd")) {
    Command::new("cmd.exe").args(["/d", "/c", claude.to_string_lossy().as_ref(), "update"]).creation_flags(CREATE_NO_WINDOW).output()
  } else {
    Command::new(claude).arg("update").creation_flags(CREATE_NO_WINDOW).output()
  }.map_err(|error| format!("Unable to start update: {error}"))?;

  let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
  let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
  if output.status.success() {
    Ok(if stdout.is_empty() { "Update check completed.".into() } else { stdout })
  } else {
    Err(if stderr.is_empty() { stdout } else { stderr })
  }
}

#[tauri::command]
fn get_models() -> Vec<String> {
  let help = find_claude().and_then(|path| {
    if path.extension().is_some_and(|extension| extension.eq_ignore_ascii_case("cmd")) {
      command_output("cmd.exe", &["/d", "/c", path.to_string_lossy().as_ref(), "--help"], None)
    } else {
      command_output(path.to_string_lossy().as_ref(), &["--help"], None)
    }
  }).unwrap_or_default().to_ascii_lowercase();

  let mut models = vec!["DEFAULT".to_string()];
  for (alias, label) in [("FABLE", "FABLE 5"), ("OPUS", "OPUS"), ("SONNET", "SONNET"), ("HAIKU", "HAIKU")] {
    if help.contains(&alias.to_ascii_lowercase()) || alias == "HAIKU" {
      models.push(label.to_string());
    }
  }
  models
}

#[tauri::command]
fn start_claude(
  app: tauri::AppHandle,
  state: State<'_, AppState>,
  project: String,
  permission: String,
  model: String,
  effort: String,
  continue_session: bool,
  rows: Option<u16>,
  cols: Option<u16>,
) -> Result<u64, String> {
  let project_path = PathBuf::from(&project);
  if !project_path.is_dir() {
    return Err("The selected project folder was not found.".into());
  }
  let dbg = |m: &str| { use std::io::Write as _; if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(std::env::temp_dir().join("deck-debug.log")) { let _ = writeln!(f, "{m}"); } };
  dbg(&format!("start_claude project={project} permission={permission} rows={rows:?} cols={cols:?}"));
  let claude = find_claude().ok_or_else(|| "Claude Code CLI was not found.".to_string())?;
  dbg(&format!("claude path = {}", claude.to_string_lossy()));
  let usage_settings = prepare_usage_capture()?;
  dbg(&format!("settings = {}", usage_settings.to_string_lossy()));
  let pty_system = native_pty_system();
  let pair = pty_system
    .openpty(PtySize { rows: rows.unwrap_or(32), cols: cols.unwrap_or(140), pixel_width: 0, pixel_height: 0 })
    .map_err(|error| format!("Unable to open PTY: {error}"))?;
  let mut command = if claude.extension().is_some_and(|extension| extension.eq_ignore_ascii_case("cmd")) {
    let mut builder = CommandBuilder::new("cmd.exe");
    builder.args(["/d", "/c", claude.to_string_lossy().as_ref()]);
    builder
  } else {
    CommandBuilder::new(claude)
  };
  command.cwd(project_path);
  command.env_remove("NO_COLOR");
  command.env("TERM", "xterm-256color");
  command.env("COLORTERM", "truecolor");
  command.env("TERM_PROGRAM", "ClaudeDeck");
  command.args(["--settings", usage_settings.to_string_lossy().as_ref()]);
  if continue_session {
    command.arg("--continue");
  }
  if !model.eq_ignore_ascii_case("default") {
    command.args(["--model", model.as_str()]);
  }
  if permission == "bypassPermissions" {
    command.arg("--dangerously-skip-permissions");
  } else if permission != "default" {
    command.args(["--permission-mode", permission.as_str()]);
  }
  command.args(["--effort", effort.as_str()]);
  let child = pair.slave.spawn_command(command).map_err(|error| format!("Unable to start Claude Code: {error}"))?;
  dbg("spawn OK");
  let mut reader = pair.master.try_clone_reader().map_err(|error| format!("Unable to read terminal: {error}"))?;
  let writer = pair.master.take_writer().map_err(|error| format!("Unable to open terminal writer: {error}"))?;
  let master = pair.master;
  let app_for_output = app.clone();
  let session_id = state.next_session_id.fetch_add(1, Ordering::Relaxed) + 1;
  let active_session_id = Arc::clone(&state.active_session_id);
  active_session_id.store(session_id, Ordering::Release);
  thread::spawn(move || {
    let dbg = |m: &str| { use std::io::Write as _; if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(std::env::temp_dir().join("deck-debug.log")) { let _ = writeln!(f, "{m}"); } };
    dbg("reader thread started");
    let mut buffer = [0_u8; 8192];
    let mut total = 0usize;
    loop {
      match reader.read(&mut buffer) {
        Ok(0) => { dbg(&format!("reader EOF (total {total} bytes)")); break; }
        Ok(count) => {
          total += count;
          let output = String::from_utf8_lossy(&buffer[..count]).into_owned();
          let _ = app_for_output.emit("terminal-output", output);
        }
        Err(error) => { dbg(&format!("reader err: {error}")); break; }
      }
    }
    if active_session_id.compare_exchange(session_id, 0, Ordering::AcqRel, Ordering::Acquire).is_ok() {
      let _ = app_for_output.emit("claude-exited", session_id);
    }
  });
  let mut session = state.session.lock().map_err(|_| "Unable to acquire session lock.".to_string())?;
  if let Some(mut previous) = session.take() {
    let _ = previous.child.kill();
  }
  *session = Some(ClaudeSession { writer, child, master });
  Ok(session_id)
}

#[tauri::command]
fn resize_terminal(state: State<'_, AppState>, rows: u16, cols: u16) -> Result<(), String> {
  let session = state.session.lock().map_err(|_| "Unable to acquire session lock.".to_string())?;
  if let Some(active) = session.as_ref() {
    active.master.resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
      .map_err(|error| format!("Unable to resize terminal: {error}"))?;
  }
  Ok(())
}

#[tauri::command]
fn write_terminal(state: State<'_, AppState>, input: String) -> Result<(), String> {
  let mut session = state.session.lock().map_err(|_| "Unable to acquire session lock.".to_string())?;
  let active = session.as_mut().ok_or_else(|| "There is no active Claude Code session.".to_string())?;
  active.writer.write_all(input.as_bytes()).map_err(|error| format!("Unable to write to terminal: {error}"))?;
  active.writer.flush().map_err(|error| format!("Unable to send terminal input: {error}"))
}

#[tauri::command]
fn stop_claude(state: State<'_, AppState>) -> Result<(), String> {
  state.active_session_id.store(0, Ordering::Release);
  let mut session = state.session.lock().map_err(|_| "Unable to acquire session lock.".to_string())?;
  if let Some(mut active) = session.take() {
    active.child.kill().map_err(|error| format!("Unable to stop Claude Code: {error}"))?;
  }
  Ok(())
}

#[tauri::command]
fn git_status(project: String) -> Result<Vec<String>, String> {
  let path = PathBuf::from(project);
  if !path.join(".git").exists() {
    return Err("The selected folder is not a Git repository.".into());
  }
  let output = command_output("git", &["status", "--porcelain=v1"], Some(&path)).unwrap_or_default();
  Ok(output.lines().map(str::to_string).collect())
}

#[tauri::command]
fn git_restore(project: String, files: Vec<String>) -> Result<(), String> {
  if files.is_empty() {
    return Ok(());
  }
  let path = PathBuf::from(project);
  let mut command = Command::new("git");
  hide_console(&mut command);
  command.current_dir(path).args(["restore", "--worktree", "--"]);
  for file in files {
    if file.contains("..") || Path::new(&file).is_absolute() {
      return Err("An unsafe file path was blocked.".into());
    }
    command.arg(file);
  }
  let output = command.output().map_err(|error| format!("Unable to run Git: {error}"))?;
  if output.status.success() {
    Ok(())
  } else {
    Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
      }
    }))
    .manage(AppState::default())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      get_system_info,
      get_windows_build,
      get_usage_metrics,
      get_notification,
      update_claude,
      get_models,
      start_claude,
      resize_terminal,
      write_terminal,
      stop_claude,
      git_status,
      git_restore
    ])
    .run(tauri::generate_context!())
    .expect("Unable to start ClaudeDeck");
}
