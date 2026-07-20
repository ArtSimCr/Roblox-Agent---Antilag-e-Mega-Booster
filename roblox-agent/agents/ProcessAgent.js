const { powershell, isWindows } = require("../utils/command");

class ProcessAgent {
  constructor(logger, config) {
    this.logger = logger;
    this.config = config;
    this.timer = null;
  }

  async listHeavyProcesses() {
    if (!isWindows()) {
      return [];
    }

    const limit = Number(this.config.maxProcessSuggestions || 5);

    const script = `
      Get-Process |
      Sort-Object CPU -Descending |
      Select-Object -First ${limit} ProcessName,Id,CPU,WorkingSet64 |
      ConvertTo-Json -Compress
    `;

    const result = await powershell(script);

    if (!result.ok || !result.stdout.trim()) {
      return [];
    }

    try {
      const parsed = JSON.parse(result.stdout.trim());

      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }

  formatMemory(bytes) {
    if (!bytes) {
      return "0 MB";
    }

    return `${Math.round(bytes / 1024 / 1024)} MB`;
  }

  async tick() {
    const processes = await this.listHeavyProcesses();

    if (!processes.length) {
      return;
    }

    const summary = processes
      .map((process) => {
        return `${process.ProcessName}(PID ${process.Id}, RAM ${this.formatMemory(
          process.WorkingSet64
        )})`;
      })
      .join(", ");

    this.logger.info(`Processos com maior uso acumulado de CPU: ${summary}`);

    if (this.config.suggestOnly) {
      this.logger.info(
        "Modo seguro: o agente apenas sugere. Nenhum processo é fechado automaticamente."
      );
    }
  }

  start() {
    if (this.timer) {
      return;
    }

    this.logger.info("ProcessAgent iniciado.");

    this.timer = setInterval(() => {
      this.tick();
    }, this.config.monitorInterval * 5);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = null;

    this.logger.info("ProcessAgent parado.");
  }
}

module.exports = ProcessAgent;