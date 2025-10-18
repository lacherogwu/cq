import colors from 'picocolors';
import { inspect } from 'node:util';

export interface LoggerOptions {
	level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
	label?: string;
	format?: 'json' | 'pretty';
}

const LOG_LEVELS = {
	trace: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4,
	fatal: 5,
} as const;

export function createLogger(options: LoggerOptions = {}) {
	const { level = 'info', label = 'CQ', format = 'pretty' } = options;
	const currentLogLevel = LOG_LEVELS[level];

	const formatTimestamp = () => {
		return new Date().toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
	};

	const msgFormatMap: Record<string, string> = {
		'Action started': '→',
		'Action completed successfully': '✓',
		'Action failed with HTTP error': '⚠',
		'Action failed with validation error': '⚠',
		'Action failed with internal error': '✗',
	};

	const log = (logLevel: keyof typeof LOG_LEVELS, msg: string, extra?: Record<string, any>) => {
		if (LOG_LEVELS[logLevel] < currentLogLevel) return;

		if (format === 'json') {
			const logEntry = {
				level: LOG_LEVELS[logLevel],
				time: Date.now(),
				service: label,
				msg,
				...extra,
			};
			console.log(JSON.stringify(logEntry));
			return;
		}

		const timestamp = formatTimestamp();
		const coloredTime = colors.dim(timestamp);
		const coloredLabel = colors.bold(colors.cyan(`[${label}]`));

		let formattedMsg = msg;
		let extraInfo = '';

		if (extra) {
			if (extra.module && extra.action) {
				const actionPath = `${colors.blue(extra.module)}/${colors.green(extra.action)}`;
				formattedMsg = `${msgFormatMap[msg] || msg} ${actionPath}`;
			}

			if (extra.type) {
				extraInfo += ` ${colors.magenta(extra.type)}`;
			}

			if (extra.input !== undefined) {
				if (extra.input === '[large payload]') {
					extraInfo += ` ${colors.dim('[large payload]')}`;
				} else {
					const inputStr = inspect(extra.input, {
						colors: false,
						compact: true,
						depth: 2,
						breakLength: Infinity,
					});
					extraInfo += ` ${colors.dim(inputStr)}`;
				}
			}

			if (extra.duration) {
				extraInfo += ` ${colors.gray(`(${extra.duration})`)}`;
			}

			if (extra.error) {
				extraInfo += ` ${colors.red(extra.error)}`;
			}

			if (extra.status) {
				extraInfo += ` ${colors.yellow(extra.status)}`;
			}
		}

		const logLine = `${coloredTime} ${coloredLabel} ${formattedMsg}${extraInfo}`;

		switch (logLevel) {
			case 'error':
			case 'fatal':
				console.error(logLine);
				break;
			case 'warn':
				console.warn(logLine);
				break;
			default:
				console.log(logLine);
				break;
		}
	};

	return {
		info: (msg: string, extra?: Record<string, any>) => log('info', msg, extra),
		error: (msg: string, extra?: Record<string, any>) => log('error', msg, extra),
		warn: (msg: string, extra?: Record<string, any>) => log('warn', msg, extra),
		debug: (msg: string, extra?: Record<string, any>) => log('debug', msg, extra),
		trace: (msg: string, extra?: Record<string, any>) => log('trace', msg, extra),
		fatal: (msg: string, extra?: Record<string, any>) => log('fatal', msg, extra),
	};
}

export const defaultLogger = createLogger();
