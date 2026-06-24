type LogLevel = "debug" | "info" | "warn" | "error";

type LoggerOptions = {
	level?: LogLevel;
};

class Logger {
	private readonly level: LogLevel;

	constructor(options?: LoggerOptions) {
		this.level = options?.level ?? "info";
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: Record<LogLevel, number> = {
			debug: 0,
			info: 1,
			warn: 2,
			error: 3,
		};
		return levels[level] >= levels[this.level];
	}

	private formatLog(msg: string, ...args: unknown[]): unknown[] {
		return [msg, ...args];
	}

	debug(msg: string, ...args: unknown[]) {
		if (!this.shouldLog("debug")) {
			return;
		}
		console.debug(...this.formatLog(msg, ...args));
	}

	info(msg: string, ...args: unknown[]) {
		if (!this.shouldLog("info")) {
			return;
		}
		console.info(...this.formatLog(msg, ...args));
	}

	warn(msg: string, ...args: unknown[]) {
		if (!this.shouldLog("warn")) {
			return;
		}
		console.warn(...this.formatLog(msg, ...args));
	}

	error(msg: string, ...args: unknown[]) {
		if (!this.shouldLog("error")) {
			return;
		}
		console.error(...this.formatLog(msg, ...args));

		// Here you could add error reporting integration like Sentry
		// if import.meta.env.PROD { ... }
	}
}

// Export a singleton instance
export const logger = new Logger();
