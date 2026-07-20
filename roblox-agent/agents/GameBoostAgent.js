const { exec } = require("child_process");
const os = require("os");

class GameBoostAgent {
  constructor(logger, config) {
    this.logger = logger;
    this.config = config;
    this.active = false;
  }

  isWindows() {
    return process.platform === "win32";
  }

  runCommand(command, timeout = 8000) {
    return new Promise((resolve) => {
      exec(
        command,
        {
          windowsHide: true,
          timeout
        },
        function (error, stdout, stderr) {
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

  lowerAgentPriority() {
    try {
      os.setPriority(process.pid, 10);
      this.logger.info("Prioridade do agente reduzida para não pesar no jogo.");
    } catch (error) {
      this.logger.warn("Não foi possível reduzir a prioridade do agente.");
    }
  }

  async boostRobloxPriority() {
    if (!this.isWindows()) {
      return;
    }

    if (this.config.boostRobloxPriority !== true) {
      this.logger.info("Boost de prioridade do Roblox está desativado no config.json.");
      return;
    }

    const command =
      'powershell -NoProfile -ExecutionPolicy Bypass -Command "' +
      "$p = Get-Process RobloxPlayerBeta -ErrorAction SilentlyContinue; " +
      "if ($p) { $p.PriorityClass = 'AboveNormal'; Write-Output 'OK' } " +
      "else { Write-Output 'NOT_FOUND' }" +
      '"';

    const result = await this.runCommand(command);

    if (result.stdout.includes("OK")) {
      this.logger.info("Roblox colocado em prioridade AboveNormal.");
    } else {
      this.logger.warn("Roblox não encontrado para aplicar prioridade AboveNormal.");
    }
  }

  async activate() {
    if (this.active) {
      return;
    }

    this.active = true;

    this.logger.info("GameBoostAgent ativado.");
    this.logger.info("Aplicando boost seguro para reduzir lag e engasgos.");

    this.lowerAgentPriority();

    await this.boostRobloxPriority();

    this.logger.info("Modo boost seguro concluído.");
    this.logger.info("O agente ficará quieto para não pesar durante o jogo.");
  }

  async restore() {
    if (!this.active) {
      return;
    }

    this.logger.info("GameBoostAgent encerrado.");
    this.active = false;
  }
}

module.exports = GameBoostAgent;