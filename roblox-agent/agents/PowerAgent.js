const { run, isWindows } = require("../utils/command");

const HIGH_PERFORMANCE_GUID = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c";

class PowerAgent {
  constructor(logger, config) {
    this.logger = logger;
    this.config = config;
    this.originalPlan = null;
  }

  async getActivePlan() {
    if (!isWindows()) {
      return null;
    }

    const result = await run("powercfg /getactivescheme");

    const match = result.stdout.match(/([a-f0-9-]{36})/i);

    return match ? match[1] : null;
  }

  async activateHighPerformance() {
    if (!isWindows()) {
      return;
    }

    if (!this.originalPlan) {
      this.originalPlan = await this.getActivePlan();
    }

    const result = await run(`powercfg /setactive ${HIGH_PERFORMANCE_GUID}`);

    if (result.ok) {
      this.logger.info("Plano Alto Desempenho ativo.");
    } else {
      this.logger.warn(
        "Não foi possível ativar Alto Desempenho. Talvez seja necessário executar como Administrador."
      );
    }
  }

  async restoreOriginalPlan() {
    if (!isWindows()) {
      return;
    }

    if (!this.originalPlan) {
      return;
    }

    const result = await run(`powercfg /setactive ${this.originalPlan}`);

    if (result.ok) {
      this.logger.info("Plano de energia original restaurado.");
    } else {
      this.logger.warn("Não foi possível restaurar o plano de energia original.");
    }

    this.originalPlan = null;
  }
}

module.exports = PowerAgent;