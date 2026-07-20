const os = require("os");
const { powershell, isWindows } = require("../utils/command");

class MonitorAgent {
  constructor(logger, config) {
    this.logger = logger;
    this.config = config;
    this.timer = null;
    this.lastCpu = this.cpuSnapshot();
  }

  cpuSnapshot() {
    const cpus = os.cpus();

    let idle = 0;
    let total = 0;

    for (const cpu of cpus) {
      for (const type of Object.keys(cpu.times)) {
        total += cpu.times[type];
      }

      idle += cpu.times.idle;
    }

    return {
      idle,
      total
    };
  }

  cpuUsagePercent() {
    const current = this.cpuSnapshot();

    const idleDiff = current.idle - this.lastCpu.idle;
    const totalDiff = current.total - this.lastCpu.total;

    this.lastCpu = current;

    if (totalDiff <= 0) {
      return 0;
    }

    return Math.round((1 - idleDiff / totalDiff) * 100);
  }

  ramUsagePercent() {
    const total = os.totalmem();
    const free = os.freemem();

    return Math.round(((total - free) / total) * 100);
  }

  async diskUsagePercent() {
    if (!isWindows()) {
      return null;
    }

    const script = `
      try {
        Get-CimInstance Win32_PerfFormattedData_PerfDisk_LogicalDisk |
        Where-Object { $_.Name -eq '_Total' } |
        Select-Object -ExpandProperty PercentDiskTime
      } catch {
        Write-Output 'NA'
      }
    `;

    const result = await powershell(script);

    const value = Number(String(result.stdout).trim());

    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.min(value, 100);
  }

  async gpuUsagePercent() {
    if (!isWindows()) {
      return null;
    }

    const script = `
      try {
        $value = (
          Get-Counter "\\GPU Engine(*)\\Utilization Percentage"
        ).CounterSamples | Measure-Object CookedValue -Sum

        :Round($value.Sum, 0)
      } catch {
        Write-Output 'NA'
      }
    `;

    const result = await powershell(script);

    const value = Number(String(result.stdout).trim());

    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.min(value, 100);
  }

  async temperatureCelsius() {
    if (!isWindows()) {
      return null;
    }

    const script = `
      try {
        $temp = Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace "root/wmi" |
        Select-Object -First 1 -ExpandProperty CurrentTemperature

        if ($temp) {
          :Round(($temp / 10) - 273.15, 1)
        } else {
          Write-Output 'NA'
        }
      } catch {
        Write-Output 'NA'
      }
    `;

    const result = await powershell(script);

    const value = Number(String(result.stdout).trim());

    if (!Number.isFinite(value)) {
      return null;
    }

    return value;
  }

  async tick() {
    const cpu = this.cpuUsagePercent();
    const ram = this.ramUsagePercent();
    const disk = await this.diskUsagePercent();
    const gpu = await this.gpuUsagePercent();
    const temp = await this.temperatureCelsius();

    const parts = [`CPU ${cpu}%`, `RAM ${ram}%`];

    if (disk !== null) {
      parts.push(`Disco ${disk}%`);
    }

    if (gpu !== null) {
      parts.push(`GPU ${gpu}%`);
    }

    if (temp !== null) {
      parts.push(`Temperatura ${temp}°C`);
    }

    this.logger.info(parts.join(" | "));

    if (cpu > 90) {
      this.logger.warn(
        "CPU muito alta. Feche aplicativos pesados se notar travamentos."
      );
    }

    if (ram > 90) {
      this.logger.warn(
        "RAM quase cheia. Considere fechar navegadores, launchers ou editores."
      );
    }

    if (disk !== null && disk > 90) {
      this.logger.warn(
        "Disco em alto uso. Atualizações, antivírus ou gravações podem causar engasgos."
      );
    }

    if (temp !== null && temp > 85) {
      this.logger.warn(
        "Temperatura alta detectada. Verifique ventilação, poeira e uso prolongado."
      );
    }
  }

  start() {
    if (this.timer) {
      return;
    }

    this.logger.info("Monitoramento contínuo iniciado.");

    this.timer = setInterval(() => {
      this.tick();
    }, this.config.monitorInterval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = null;

    this.logger.info("Monitoramento contínuo parado.");
  }
}

module.exports = MonitorAgent;