const fs = require("fs");
const path = require("path");

const Logger = require("./utils/Logger");
const RobloxAgent = require("./agents/RobloxAgent");
const GameBoostAgent = require("./agents/GameBoostAgent");

function loadConfig() {
  const configPath = path.join(__dirname, "config.json");

  const defaultConfig = {
    autoStart: true,
    monitorInterval: 60000,
    logging: true,
    ultraLightMode: true,
    boostRobloxPriority: true
  };

  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }

  try {
    const fileContent = fs.readFileSync(configPath, "utf8");
    const userConfig = JSON.parse(fileContent);

    return {
      ...defaultConfig,
      ...userConfig
    };
  } catch (error) {
    console.log("Erro ao carregar config.json. Usando configuração padrão.");
    return defaultConfig;
  }
}

class MainAgent {
  constructor() {
    this.config = loadConfig();

    this.logger = new Logger(this.config.logging);

    this.robloxAgent = new RobloxAgent(this.logger, this.config);
    this.gameBoostAgent = new GameBoostAgent(this.logger, this.config);

    this.robloxRunning = false;
  }

  start() {
    this.logger.info("Roblox Performance Agent iniciado.");
    this.logger.info("Modo leve + GameBoost ativado.");
    this.logger.info("Nenhum arquivo do Roblox será modificado.");
    this.logger.info("Nenhuma memória do jogo será alterada.");
    this.logger.info("Nenhum processo será fechado automaticamente.");

    if (process.argv.includes("--check")) {
      this.logger.info("Verificação concluída.");
      return;
    }

    this.robloxAgent.on("stateChanged", async (state, robloxInfo) => {
      if (state === "Executando" && this.robloxRunning === false) {
        this.robloxRunning = true;

        this.logger.info("Roblox detectado.");
        this.logger.info("Ativando GameBoostAgent...");

        await this.gameBoostAgent.activate();

        this.logger.info("Roblox em modo boost seguro.");
      }

      if (state === "Fechado" && this.robloxRunning === true) {
        this.robloxRunning = false;

        await this.gameBoostAgent.restore();

        this.logger.info("Roblox fechado.");
        this.logger.info("Agente voltou ao modo de espera.");
      }
    });

    this.robloxAgent.start();
  }

  async shutdown() {
    this.logger.info("Encerrando agente...");

    this.robloxAgent.stop();

    await this.gameBoostAgent.restore();

    this.logger.info("Agente encerrado.");

    process.exit(0);
  }
}

const app = new MainAgent();

process.on("SIGINT", async function () {
  await app.shutdown();
});

process.on("SIGTERM", async function () {
  await app.shutdown();
});

app.start();