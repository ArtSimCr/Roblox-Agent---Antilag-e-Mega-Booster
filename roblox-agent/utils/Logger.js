const fs = require("fs");
const path = require("path");

class Logger {
  constructor(enabled = true) {
    this.enabled = enabled;

    this.logDir = path.join(__dirname, "..", "logs");
    this.logFile = path.join(
      this.logDir,
      `agent-${new Date().toISOString().slice(0, 10)}.log`
    );

    fs.mkdirSync(this.logDir, { recursive: true });
  }

  stamp() {
    return new Date().toLocaleTimeString("pt-BR", {
      hour12: false
    });
  }

  write(level, message) {
    const line = `[${this.stamp()}] ${level}: ${message}`;

    console.log(line);

    if (this.enabled) {
      fs.appendFileSync(this.logFile, line + "\n", "utf8");
    }
  }

  info(message) {
    this.write("INFO", message);
  }

  warn(message) {
    this.write("AVISO", message);
  }

  error(message) {
    this.write("ERRO", message);
  }
}

module.exports = Logger;