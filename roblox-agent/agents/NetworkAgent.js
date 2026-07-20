const { run, isWindows } = require("../utils/command");

class NetworkAgent {
  constructor(logger, config) {
    this.logger = logger;
    this.config = config;
    this.timer = null;
  }

  parsePing(output) {
    const lossMatch = output.match(/(\d+)%\s*(?:loss|perda)/i);

    const averageMatch = output.match(
      /Average\s*=\s*(\d+)ms|M[ée]dia\s*=\s*(\d+)ms/i
    );

    const loss = lossMatch ? Number(lossMatch[1]) : null;
    const average = averageMatch
      ? Number(averageMatch[1] || averageMatch[2])
      : null;

    return {
      loss,
      average
    };
  }

  async tick() {
    if (!isWindows()) {
      return;
    }

    const target = this.config.networkTarget || "8.8.8.8";

    const result = await run(`ping -n 4 ${target}`, {
      timeout: 10000
    });

    const stats = this.parsePing(result.stdout);

    if (stats.average !== null) {
      this.logger.info(`Rede: ping médio ${stats.average}ms para ${target}.`);
    }

    if (stats.loss !== null) {
      this.logger.info(`Rede: perda de pacotes ${stats.loss}%.`);
    }

    if (stats.loss > 0) {
      this.logger.warn(
        "Perda de pacotes detectada. Verifique Wi-Fi, cabo, roteador ou downloads em segundo plano."
      );
    }

    if (stats.average !== null && stats.average > 120) {
      this.logger.warn(
        "Ping médio alto. Isso pode indicar instabilidade na conexão."
      );
    }
  }

  start() {
    if (this.timer) {
      return;
    }

    this.logger.info("NetworkAgent iniciado.");

    this.timer = setInterval(() => {
      this.tick();
    }, this.config.monitorInterval * 10);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = null;

    this.logger.info("NetworkAgent parado.");
  }
}

module.exports = NetworkAgent;