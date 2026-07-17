import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import "@xterm/xterm/css/xterm.css";
import iconSprite from "./assets/claudedeck-icons.svg?no-inline";

type PowerState = "OFF" | "STARTING" | "ON" | "STOPPING";
type Level = "LOW" | "HIGH";
type PermissionMode = "ASK" | "AUTO";
type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean;
  start: () => void; stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SystemInfo = { claudePath: string | null; claudeVersion: string | null; gitAvailable: boolean; activeCli: boolean };
type UsageMetrics = { context: number | null; fiveHour: number | null; weekly: number | null };

const inTauri = () => "__TAURI_INTERNALS__" in window;

const fallbackModels = ["DEFAULT", "FABLE 5", "OPUS", "SONNET", "HAIKU"];
const cliModelName = (model: string) => model === "FABLE 5" ? "fable" : model.toLowerCase();
type IconName = "power" | "update" | "sync" | "mic" | "terminal" | "close" | "model" | "engine" | "permission" | "folder" | "settings";

function DeckIcon({ name }: { name: IconName }) {
  return <svg className="deck-icon" aria-hidden="true"><use href={`${iconSprite}#${name}`} /></svg>;
}

type KeyButtonProps = {
  label: string;
  shortcut: string;
  className?: string;
  icon?: React.ReactNode;
  accent?: "white" | "red" | "blue";
  onClick: () => void;
};

function KeyButton({ label, shortcut, className = "", icon, accent = "white", onClick }: KeyButtonProps) {
  return (
    <button
      className={`key key-${accent} ${className}`}
      onClick={onClick}
      aria-label={`${label}, ${shortcut}`}
      title={`${label} - ${shortcut}`}
    >
      <span className="key-main">{icon}{label}</span>
      <span className="key-shortcut">{shortcut}</span>
    </button>
  );
}

function App() {
  const [power, setPower] = useState<PowerState>("OFF");
  const [level, setLevel] = useState<Level>(() => (localStorage.getItem("claudedeck-level") as Level) || "HIGH");
  const [models, setModels] = useState(fallbackModels);
  const [modelIndex, setModelIndex] = useState(() => Number(localStorage.getItem("claudedeck-model") || 2));
  const [permission, setPermission] = useState<PermissionMode>(() => (localStorage.getItem("claudedeck-permission") as PermissionMode) || "ASK");
  const [task, setTask] = useState("CLAUDE CODE");
  const [update, setUpdate] = useState("READY");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [resumePickerOpen, setResumePickerOpen] = useState(false);
  const [dialog, setDialog] = useState<"discard" | "settings" | "project" | null>(null);
  const [listening, setListening] = useState(false);
  const [project, setProject] = useState(() => localStorage.getItem("claudedeck-project") || "");
  const [projectDraft, setProjectDraft] = useState(() => localStorage.getItem("claudedeck-project") || "C:\\Users\\umuti\\Projects\\claude_control");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [notice, setNotice] = useState("");
  const [claudeNotice, setClaudeNotice] = useState("");
  const [changedFiles, setChangedFiles] = useState<string[]>([]);
  const [usage, setUsage] = useState<UsageMetrics>(() => {
    try { return JSON.parse(localStorage.getItem("claudedeck-usage-cli") || "null") || { context: null, fiveHour: null, weekly: null }; }
    catch { return { context: null, fiveHour: null, weekly: null }; }
  });
  const terminalElement = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const terminalOutputBuffer = useRef("");
  const knobDragStart = useRef<number | null>(null);
  const speechRecognition = useRef<SpeechRecognitionLike | null>(null);

  const cliConfig = (nextPermission: PermissionMode = permission, continueSession = false) => ({
    project,
    permission: nextPermission === "AUTO" ? "bypassPermissions" : "default",
    model: cliModelName(model),
    effort: level.toLowerCase(),
    continueSession,
    rows: terminalInstance.current?.rows,
    cols: terminalInstance.current?.cols,
  });

  const model = models[modelIndex] || models[0];
  const isOn = power === "ON";
  const lcdMessage = notice
    ? `ALERT: ${notice}`
    : claudeNotice
      ? `CLAUDE: ${claudeNotice}`
      : update !== "READY"
        ? `UPDATE: ${update}`
        : power === "STARTING" || power === "STOPPING"
          ? `POWER: ${power}`
          : task !== "CLAUDE CODE"
            ? task
            : "SYSTEM READY";
  const lcdWarning = Boolean(notice) || update === "FAILED" || task.endsWith("FAILED");
  const applyUsage = (metrics: UsageMetrics) => {
    setUsage((current) => {
      const next = {
        context: metrics.context ?? current.context,
        fiveHour: metrics.fiveHour ?? current.fiveHour,
        weekly: metrics.weekly ?? current.weekly,
      };
      localStorage.setItem("claudedeck-usage-cli", JSON.stringify(next));
      return next;
    });
  };

  const togglePower = async () => {
    if (power !== "OFF" && power !== "ON") return;
    const turningOn = power === "OFF";
    if (turningOn && inTauri() && !project) {
      await selectProject();
      setNotice("Select a project, then press POWER again.");
      return;
    }
    setPower(turningOn ? "STARTING" : "STOPPING");
    setTask(turningOn ? "CLAUDE STARTING" : "CLAUDE STOPPING");
    try {
      if (inTauri()) {
        if (turningOn) await invoke("start_claude", cliConfig());
        else await invoke("stop_claude");
      }
      setPower(turningOn ? "ON" : "OFF");
      setTask(turningOn ? "CLAUDE CODE" : "STANDBY");
      if (turningOn) setTerminalOpen(true);
    } catch (error) {
      setPower("OFF");
      setTask("START FAILED");
      setNotice(String(error));
    }
  };

  const cycleModel = (direction = 1) => {
    setModelIndex((current) => {
      const next = (current + direction + models.length) % models.length;
      if (inTauri() && isOn) {
        void invoke("write_terminal", { input: `/model ${cliModelName(models[next])}\r` })
          .catch((error) => setNotice(String(error)));
      }
      setTask(`MODEL ${models[next]}`);
      return next;
    });
  };

  const handleKnobPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    knobDragStart.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleKnobPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (knobDragStart.current === null) return;
    const distance = knobDragStart.current - event.clientY;
    if (Math.abs(distance) >= 22) {
      cycleModel(distance > 0 ? 1 : -1);
      knobDragStart.current = event.clientY;
    }
  };

  const handleKnobPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (knobDragStart.current !== null && Math.abs(knobDragStart.current - event.clientY) < 5) cycleModel();
    knobDragStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const restartWithConfig = async (nextPermission: PermissionMode) => {
    if (!isOn || !inTauri()) return;
    setPower("STARTING");
    setTask("SWITCHING CONFIG");
    try {
      await invoke("stop_claude");
      await invoke("start_claude", cliConfig(nextPermission, true));
      await invoke("write_terminal", { input: `/model ${cliModelName(model)}\r` });
      setPower("ON");
      setTask("CLI READY");
    } catch (error) {
      setPower("OFF");
      setTask("SWITCH FAILED");
      setNotice(String(error));
    }
  };

  const toggleLevel = () => {
    const next: Level = level === "LOW" ? "HIGH" : "LOW";
    setLevel(next);
    setTask(`EFFORT ${next}`);
    if (isOn && inTauri()) void invoke("write_terminal", { input: `/effort ${next.toLowerCase()}\r` }).catch((error) => setNotice(String(error)));
  };

  const togglePermission = () => {
    const next: PermissionMode = permission === "ASK" ? "AUTO" : "ASK";
    setPermission(next);
    void restartWithConfig(next);
  };

  const closeApplication = async () => {
    if (!inTauri()) return;
    try { await invoke("stop_claude"); } catch { /* Oturum yoksa pencere yine kapanır. */ }
    await getCurrentWindow().close();
  };

  const toggleMicrophone = () => {
    if (listening) {
      speechRecognition.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognitionCtor = (window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    }).SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setNotice("Speech recognition is unavailable in this Windows WebView version.");
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "tr-TR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      if (isOn && inTauri()) void invoke("write_terminal", { input: `${transcript}\r` });
      setTask("VOICE SENT");
    };
    recognition.onerror = (event) => { setListening(false); setNotice(`Microphone error: ${event.error}`); };
    recognition.onend = () => setListening(false);
    speechRecognition.current = recognition;
    setListening(true);
    setTask("LISTENING");
    recognition.start();
  };

  const checkUpdates = async () => {
    setUpdate("CHECKING");
    setTask("CHECKING CLI");
    if (!inTauri()) { window.setTimeout(() => setUpdate("READY"), 800); return; }
    try {
      setUpdate("UPDATING");
      const result = await invoke<string>("update_claude");
      setUpdate("READY");
      setTask("CLI UPDATED");
      setNotice(result.split(/\r?\n/).filter(Boolean).at(-1) || "Update completed.");
    } catch (error) {
      setUpdate("FAILED");
      setTask("UPDATE FAILED");
      setNotice(String(error));
    }
  };

  const sync = async () => {
    setTask("READING USAGE");
    if (isOn && inTauri()) {
      try {
        const metrics = await invoke<UsageMetrics>("get_usage_metrics");
        applyUsage(metrics);
        setTask("USAGE UPDATED");
        if (metrics.context === null) setNotice("Usage values appear after the first Claude response.");
      } catch (error) { setNotice(String(error)); }
    } else {
      setNotice("Start the selected Claude session before reading usage.");
    }
  };

  const resumeClaude = async () => {
    if (!inTauri()) { setTerminalOpen(true); return; }
    try {
      if (!isOn) {
        setPower("STARTING");
        setTask("RESUMING");
        await invoke("start_claude", cliConfig(permission, true));
        setPower("ON");
        setTerminalOpen(true);
        setTask("SESSION RESUMED");
        return;
      }
      setTerminalOpen(true);
      if (resumePickerOpen) {
        await invoke("write_terminal", { input: "\u001b[B" });
        setTask("NEXT SESSION");
      } else {
        await invoke("write_terminal", { input: "/resume\r" });
        setResumePickerOpen(true);
        setTask("SELECT SESSION");
      }
    } catch (error) {
      setPower("OFF");
      setResumePickerOpen(false);
      setTask("RESUME FAILED");
      setNotice(String(error));
    }
  };

  const selectProject = async () => {
    setProjectDraft(project || "C:\\Users\\umuti\\Projects\\claude_control");
    setDialog("project");
  };

  const saveProject = () => {
    const selected = projectDraft.trim();
    if (!selected) return;
    setProject(selected);
    localStorage.setItem("claudedeck-project", selected);
    setTask("PROJECT SELECTED");
    setDialog(null);
  };

  const previewDiscard = async () => {
    if (!project) { setNotice("Select a project first."); return; }
    if (!inTauri()) { setChangedFiles([]); setDialog("discard"); return; }
    try {
      const entries = await invoke<string[]>("git_status", { project });
      setChangedFiles(entries);
      setDialog("discard");
    } catch (error) { setNotice(String(error)); }
  };

  const restoreFiles = async () => {
    const files = changedFiles
      .filter((entry) => !entry.startsWith("??"))
      .map((entry) => entry.slice(3).trim())
      .filter(Boolean);
    try {
      if (inTauri()) await invoke("git_restore", { project, files });
      setChangedFiles([]);
      setDialog(null);
      setNotice("Tracked files were restored safely.");
    } catch (error) { setNotice(String(error)); }
  };

  useEffect(() => {
    localStorage.setItem("claudedeck-level", level);
    localStorage.setItem("claudedeck-model", String(modelIndex));
    localStorage.setItem("claudedeck-permission", permission);
  }, [level, modelIndex, permission]);

  useEffect(() => {
    if (!inTauri()) return;
    const refreshSystemInfo = () => invoke<SystemInfo>("get_system_info").then(setSystemInfo).catch((error) => setNotice(String(error)));
    void refreshSystemInfo();
    const timer = window.setInterval(refreshSystemInfo, 15000);
    const unlistenOutput = listen<string>("terminal-output", (event) => {
      if (terminalInstance.current) {
        terminalInstance.current.write(event.payload);
      } else {
        terminalOutputBuffer.current = `${terminalOutputBuffer.current}${event.payload}`.slice(-100_000);
      }
      const text = event.payload.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, " ").replace(/\s+/g, " ");
      const readPercent = (pattern: RegExp) => {
        const match = text.match(pattern);
        return match ? Math.min(100, Number(match[1])) : null;
      };
      const context = readPercent(/(?:context|tokens?)[^%]{0,70}?(\d{1,3})%/i);
      const fiveHour = readPercent(/(?:5\s*(?:hour|hours|saat)|current\s+session)[^%]{0,70}?(\d{1,3})%/i);
      const weekly = readPercent(/(?:week|weekly|hafta)[^%]{0,70}?(\d{1,3})%/i);
      if (context !== null || fiveHour !== null || weekly !== null) {
        setUsage((current) => ({ context: context ?? current.context, fiveHour: fiveHour ?? current.fiveHour, weekly: weekly ?? current.weekly }));
      }
    });
    const unlistenExit = listen("claude-exited", () => {
      setPower("OFF"); setResumePickerOpen(false); setTask("SESSION ENDED");
    });
    return () => { window.clearInterval(timer); void unlistenOutput.then((fn) => fn()); void unlistenExit.then((fn) => fn()); };
  }, []);

  useEffect(() => {
    if (!inTauri()) return;
    try {
      setUsage(JSON.parse(localStorage.getItem("claudedeck-usage-cli") || "null") || { context: null, fiveHour: null, weekly: null });
    } catch { setUsage({ context: null, fiveHour: null, weekly: null }); }
    const refreshUsage = () => invoke<UsageMetrics>("get_usage_metrics")
      .then(applyUsage)
      .catch(() => undefined);
    void refreshUsage();
    const timer = window.setInterval(refreshUsage, 5000);
    return () => window.clearInterval(timer);
  }, [power]);

  useEffect(() => {
    if (!inTauri() || power !== "ON") return;
    let timeout: number | undefined;
    const refreshNotice = () => invoke<string | null>("get_notification")
      .then((message) => {
        if (message) {
          setClaudeNotice(message);
          if (timeout) window.clearTimeout(timeout);
          timeout = window.setTimeout(() => setClaudeNotice(""), 6000);
        }
      })
      .catch(() => undefined);
    const timer = window.setInterval(refreshNotice, 1500);
    return () => { window.clearInterval(timer); if (timeout) window.clearTimeout(timeout); };
  }, [power]);

  useEffect(() => {
    if (!inTauri()) return;
    invoke<string[]>("get_models").then((available) => {
      if (!available.length) return;
      const current = model;
      setModels(available);
      const nextIndex = available.indexOf(current);
      setModelIndex(nextIndex >= 0 ? nextIndex : 0);
    }).catch((error) => setNotice(String(error)));
  }, []);

  useEffect(() => {
    if (!terminalOpen || !terminalElement.current || terminalInstance.current) return;
    const host = terminalElement.current;
    let disposed = false;
    let terminal: Terminal | null = null;
    let fit: FitAddon | null = null;
    let observer: ResizeObserver | null = null;
    let settle: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      // VS Code parity: tell xterm the real ConPTY build so its reflow behaviour
      // matches what the backend (portable-pty / ConPTY) actually does. Omitting
      // this causes the mangled / clipped TUI output seen with claude & co.
      let buildNumber = 22621;
      if (inTauri()) {
        try { buildNumber = await invoke<number>("get_windows_build"); } catch { /* fallback build */ }
      }
      if (disposed) return;

      const term = new Terminal({
        fontFamily: "'0xProto Nerd Font Mono', 'Cascadia Mono', Consolas, monospace",
        fontSize: 13,
        lineHeight: 1.0,
        letterSpacing: 0,
        cursorBlink: true,
        scrollback: 5000,
        allowProposedApi: true,
        // Draw box-drawing / block / Powerline glyphs procedurally so TUI borders
        // stay crisp and gap-free.
        customGlyphs: true,
        windowsPty: { backend: "conpty", buildNumber },
        theme: {
          background: "#1e1e1e", foreground: "#cccccc", cursor: "#aeafad", cursorAccent: "#1e1e1e",
          selectionBackground: "rgba(38,79,120,0.6)",
          black: "#000000", red: "#cd3131", green: "#0dbc79", yellow: "#e5e510", blue: "#2472c8",
          magenta: "#bc3fbc", cyan: "#11a8cd", white: "#e5e5e5",
          brightBlack: "#666666", brightRed: "#f14c4c", brightGreen: "#23d18b", brightYellow: "#f5f543",
          brightBlue: "#3b8eea", brightMagenta: "#d670d6", brightCyan: "#29b8db", brightWhite: "#ffffff",
        },
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new Unicode11Addon());
      term.unicode.activeVersion = "11";
      term.open(host);
      // Keep the DOM renderer (no WebGL/Canvas addon) for resize correctness.
      terminal = term;
      fit = fitAddon;
      terminalInstance.current = term;

      term.writeln("\x1b[32mClaudeDeck Terminal\x1b[0m");
      if (terminalOutputBuffer.current) {
        term.write(terminalOutputBuffer.current);
        terminalOutputBuffer.current = "";
      }
      term.onData((input) => { if (inTauri() && isOn) void invoke("write_terminal", { input }); });

      // First measurement: move xterm AND the PTY to the real cell size in the same
      // tick so TUI apps do not draw their first frames at the default PTY width.
      try {
        const dims = fitAddon.proposeDimensions();
        if (dims && Number.isFinite(dims.cols) && Number.isFinite(dims.rows)) {
          const cols = Math.max(2, Math.floor(dims.cols));
          const rows = Math.max(1, Math.floor(dims.rows));
          term.resize(cols, rows);
          if (inTauri()) void invoke("resize_terminal", { rows, cols }).catch(() => undefined);
        }
      } catch { /* not visible yet */ }

      // Single atomic resize channel: settle, then move xterm view AND PTY to the
      // new size in the same tick. No double channel via term.onResize.
      const scheduleResize = () => {
        if (settle) clearTimeout(settle);
        settle = setTimeout(() => {
          if (disposed || !fit) return;
          const dims = fit.proposeDimensions();
          if (!dims || !Number.isFinite(dims.cols) || !Number.isFinite(dims.rows)) return;
          const cols = Math.max(2, Math.floor(dims.cols));
          const rows = Math.max(1, Math.floor(dims.rows));
          if (cols === term.cols && rows === term.rows) return;
          term.resize(cols, rows);
          if (inTauri()) void invoke("resize_terminal", { rows, cols }).catch(() => undefined);
        }, 180);
      };
      observer = new ResizeObserver(scheduleResize);
      observer.observe(host);
    })();

    return () => {
      disposed = true;
      if (settle) clearTimeout(settle);
      if (observer) observer.disconnect();
      if (terminal) terminal.dispose();
      terminalInstance.current = null;
    };
  }, [terminalOpen, isOn]);

  useEffect(() => {
    if (!inTauri()) return;
    let disposed = false;
    let unlisten: (() => void) | undefined;

    void getCurrentWindow().onDragDropEvent((event) => {
      if (event.payload.type !== "drop" || !isOn || !terminalOpen || !terminalElement.current) return;
      const scale = window.devicePixelRatio || 1;
      const x = event.payload.position.x / scale;
      const y = event.payload.position.y / scale;
      const bounds = terminalElement.current.getBoundingClientRect();
      if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return;

      const input = `${event.payload.paths
        .map((path) => (/\s/.test(path) ? `"${path}"` : path))
        .join(" ")} `;
      if (!input.trim()) return;
      terminalInstance.current?.focus();
      void invoke("write_terminal", { input }).catch((error) => setNotice(String(error)));
    }).then((stopListening) => {
      if (disposed) stopListening();
      else unlisten = stopListening;
    }).catch((error) => setNotice(String(error)));

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [terminalOpen, isOn]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "F1") { event.preventDefault(); togglePower(); }
      if (event.key === "F2") { event.preventDefault(); toggleLevel(); }
      if (event.key === "F3") { event.preventDefault(); cycleModel(event.shiftKey ? -1 : 1); }
      if (event.key === "F4") { event.preventDefault(); checkUpdates(); }
      if (event.key === "F5") { event.preventDefault(); sync(); }
      if (event.ctrlKey && event.key === "Enter") { event.preventDefault(); void resumeClaude(); }
      if (resumePickerOpen && (event.key === "Enter" || event.key === "Escape")) setResumePickerOpen(false);
      if (event.ctrlKey && event.key.toLowerCase() === "r") { event.preventDefault(); setTask("RETRYING"); if (isOn && inTauri()) void invoke("write_terminal", { input: "\u001b[A\r" }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <main className="workspace">
      <section className={`device ${isOn ? "device-on" : ""}`} aria-label="ClaudeDeck control device">
        <div className="rear-shell">
          <div className="drag-handle" data-tauri-drag-region title="Drag the application from here" aria-label="Application drag handle">
            <span data-tauri-drag-region className="drag-dots">⠿</span>
          </div>
          <button className="device-close" onClick={closeApplication} aria-label="Close ClaudeDeck" title="Close application">
            <DeckIcon name="close" />
          </button>
          <div className="display-housing">
            <div className="display-glass">
              <div className="display-terminal">
                {terminalOpen ? <div className="terminal-body" ref={terminalElement} /> : <div className="terminal-standby">— TERMINAL STANDBY —</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="metal-panel">
          <div
            className={`alert-display ${lcdWarning ? "alert-display-warning" : lcdMessage !== "SYSTEM READY" ? "alert-display-notice" : ""}`}
            onClick={() => setNotice("")}
            title={notice ? "Dismiss notification" : "ClaudeDeck status display"}
            role="status"
          >
            <span>{lcdMessage}</span>
          </div>
          <div className="control-bank">
            <div className="mini-switch">
              <button className={`toggle-switch ${level === "HIGH" ? "toggle-on" : ""}`} onClick={toggleLevel} aria-label={`Effort level ${level}`} title="Profile - F2">
                <span className="toggle-track"><i /></span>
              </button>
              <span>LEVEL</span><b>{level}</b>
            </div>
            <div className="mini-switch">
              <button className={`toggle-switch ${permission === "AUTO" ? "toggle-on" : ""}`} onClick={togglePermission} aria-label={`Permission mode ${permission}`} title="Permission mode ASK / AUTO">
                <span className="toggle-track"><i /></span>
              </button>
              <span>PERMISSION</span><b>{permission}</b>
            </div>
            <span className="hardware-shortcut">F2</span>
          </div>

          <div className="top-keys">
            <KeyButton label="POWER" shortcut="F1" icon={<DeckIcon name="power" />} className={`power-key power-${power.toLowerCase()}`} onClick={togglePower} />
            <KeyButton label="UPDATE" shortcut="F4" icon={<DeckIcon name="update" />} accent="blue" className={`update-${update.toLowerCase()}`} onClick={checkUpdates} />
            <KeyButton label="SYNC" shortcut="F5" icon={<DeckIcon name="sync" />} accent="red" className={task === "READING USAGE" ? "key-busy" : task === "USAGE UPDATED" ? "key-success" : ""} onClick={sync} />
          </div>

          <div className="model-control">
            <div className="model-options">
              {models.map((option, index) => <span className={index === modelIndex ? "active" : ""} key={option}>{option}</span>)}
            </div>
            <button
              className="knob"
              onPointerDown={handleKnobPointerDown}
              onPointerMove={handleKnobPointerMove}
              onPointerUp={handleKnobPointerUp}
              onWheel={(event) => { event.preventDefault(); cycleModel(event.deltaY > 0 ? 1 : -1); }}
              aria-label={`Change model, selected ${model}`}
              title="Rotate / drag / wheel - F3"
            >
              <span className="knob-ticks" aria-hidden="true">
                {models.map((option, index) => {
                  const tickAngle = models.length > 1 ? -120 + index * (240 / (models.length - 1)) : 0;
                  return <i key={option} className={index === modelIndex ? "tick-active" : ""} style={{ transform: `rotate(${tickAngle}deg)` }} />;
                })}
              </span>
              <span className="knob-cap" style={{ transform: `rotate(${models.length > 1 ? -120 + modelIndex * (240 / (models.length - 1)) : 0}deg)` }}><b /></span>
            </button>
            <span className="hardware-label">MODEL SWITCHER</span>
            <span className="hardware-shortcut">F3</span>
          </div>

          <div className="bottom-keys">
            <KeyButton label="DISCARD" shortcut="DEL" className={dialog === "discard" ? "key-danger-active" : ""} onClick={previewDiscard} />
            <KeyButton label="RETRY" shortcut="CTRL+R" className={task === "RETRYING" ? "key-busy" : ""} onClick={() => { setTask("RETRYING"); if (isOn && inTauri()) void invoke("write_terminal", { input: "\u001b[A\r" }); }} />
            <KeyButton label="" shortcut="V HOLD" icon={<DeckIcon name="mic" />} className={listening ? "is-listening" : ""} onClick={toggleMicrophone} />
            <KeyButton label="RESUME" shortcut="CTRL+ENTER" className={`run-key ${resumePickerOpen ? "key-busy" : isOn ? "key-success" : "key-disabled-state"}`} onClick={() => void resumeClaude()} />
            <div className="usage-gauges" aria-label="Claude usage gauges">
              {[
                ["CONTEXT", usage.context],
                ["5H LIMIT", usage.fiveHour],
                ["WEEKLY", usage.weekly],
              ].map(([label, rawValue]) => {
                const value = typeof rawValue === "number" ? Math.min(100, Math.max(0, rawValue)) : null;
                return <div className="usage-gauge" key={label as string}>
                  <div className="gauge-scale"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
                  <div className="gauge-track" role="progressbar" aria-label={label as string} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value ?? undefined}>
                    <i style={{ "--gauge-ratio": (value ?? 0) / 100 } as React.CSSProperties} />
                  </div>
                  <div className="gauge-reading"><b>{value === null ? "--" : `${Math.round(value)}%`}</b><span>{label}</span></div>
                </div>;
              })}
            </div>
          </div>
        </div>
        <div className="device-edge" />
      </section>

      {dialog && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
          <section className="modal" role="dialog" aria-modal="true">
            <h2>{dialog === "discard" ? "Restore changes" : dialog === "project" ? "Project folder" : "ClaudeDeck settings"}</h2>
            <p>{dialog === "discard" ? "Files changed by the last Claude task will be reviewed. Existing user changes are preserved." : dialog === "project" ? "Enter the full path of the folder where Claude Code will run." : "Manage project, model, voice, and appearance settings here."}</p>
            {dialog === "discard" && <>
              <div className="file-summary"><span>Total changes</span><strong>{changedFiles.length}</strong><span>Untracked files</span><strong>{changedFiles.filter((item) => item.startsWith("??")).length}</strong></div>
              <div className="changed-files">{changedFiles.length ? changedFiles.map((file) => <code key={file}>{file}</code>) : <span>No changes to restore.</span>}</div>
            </>}
            {dialog === "settings" && <div className="settings-summary">
              <span>Claude Code</span><strong>{systemInfo?.claudeVersion || (systemInfo?.claudePath ? "Found" : "Checking")}</strong>
              <span>Active project</span><strong>{project || "Not selected"}</strong>
              <span>Git</span><strong>{systemInfo?.gitAvailable ? "Ready" : "Not found"}</strong>
            </div>}
            {dialog === "project" && <input className="project-input" value={projectDraft} onChange={(event) => setProjectDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveProject(); }} autoFocus />}
            <div className="modal-actions"><button onClick={() => setDialog(null)}>CANCEL</button><button className="primary" disabled={(dialog === "discard" && !changedFiles.some((item) => !item.startsWith("??"))) || (dialog === "project" && !projectDraft.trim())} onClick={dialog === "discard" ? restoreFiles : dialog === "project" ? saveProject : () => setDialog(null)}>{dialog === "discard" ? "RESTORE SAFELY" : dialog === "project" ? "SELECT PROJECT" : "OK"}</button></div>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
