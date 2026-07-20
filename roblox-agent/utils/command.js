const { exec, execFile } = require("child_process");

function isWindows() {
  return process.platform === "win32";
}

function run(command, options = {}) {
  return new Promise((resolve) => {
    exec(
      command,
      {
        windowsHide: true,
        timeout: options.timeout || 8000
      },
      (error, stdout, stderr) => {
        resolve({
          ok: !error,
          stdout: stdout || "",
          stderr: stderr || "",
          error: error || null
        });
      }
    );
  });
}

function powershell(script, options = {}) {
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script
      ],
      {
        windowsHide: true,
        timeout: options.timeout || 8000
      },
      (error, stdout, stderr) => {
        resolve({
          ok: !error,
          stdout: stdout || "",
          stderr: stderr || "",
          error: error || null
        });
      }
    );
  });
}

module.exports = {
  run,
  powershell,
  isWindows
};