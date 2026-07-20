const EventEmitter = require("events");
const { exec } = require("child_process");

class RobloxAgent extends EventEmitter {
  constructor(logger, config) {
    super();

    this.logger = logger;
    this.config = config;
    this.timer = null;
    this.state = "Fechado";
  }

  isWindows() {
    return process.platform === "win32";
  }

  findRobloxProcess() {
    return new Promise((resolve) => {
      if (!this.isWindows()) {
        resolve(null);
        return;
      }

      const command = 'tasklist /FI "IMAGENAME eq RobloxPlayerBeta.exe" /FO CSV /NH';

      exec(
        command,
        {
          windowsHide: true,
          timeout: 5000
        },
        function (error, stdout) {
          if (error || !stdout) {
            resolve(null);
            return;
          }

          if (stdout.includes("RobloxPlayerBeta.exe")) {
            resolve({
              name: "RobloxPlayerBeta.exe"
            });
            return;
          }

          resolve(null);
        }
      );
    });
  }

  setState(nextState, info) {
    if (this.state !== nextState) {
      this.state = nextState;
      this.emit("stateChanged", nextState, info || null);
    }
  }

  start() {
    const interval = this.config.monitorInterval || 60000;

    this.logger.info("RobloxAgent Ultra Leve iniciado.");
    this.logger.info("Verificando Roblox a cada " + interval / 1000 + " segundos.");

    this.timer = setInterval(async () => {
      const robloxInfo = await this.findRobloxProcess();

      if (robloxInfo) {
        this.setState("Executando", robloxInfo);
      } else {
        this.setState("Fechado", null);
      }
    }, interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = null;
  }
}

module.exports = RobloxAgent;