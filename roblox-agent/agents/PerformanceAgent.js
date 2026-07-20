class PerformanceAgent {
  constructor(logger, config, powerAgent) {
    this.logger = logger;
    this.config = config;
    this.powerAgent = powerAgent;
    this.active = false;
  }

  async activate(robloxInfo) {
    this.active = true;

    this.logger.info("Modo Performance Leve ativado.");
    this.logger.info("Nenhuma alteração será feita no Roblox.");
    this.logger.info("Prioridade alta desativada.");
    this.logger.info("Alteração de plano de energia desativada.");
  }

  async restore() {
    if (!this.active) {
      return;
    }

    this.logger.info("Modo Performance Leve encerrado.");

    this.active = false;
  }
}

module.exports = PerformanceAgent;