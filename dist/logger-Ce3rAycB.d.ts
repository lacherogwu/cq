interface LoggerOptions {
    level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    label?: string;
    format?: 'json' | 'pretty';
}
declare function createLogger(options?: LoggerOptions): {
    info: (msg: string, extra?: Record<string, any>) => void;
    error: (msg: string, extra?: Record<string, any>) => void;
    warn: (msg: string, extra?: Record<string, any>) => void;
    debug: (msg: string, extra?: Record<string, any>) => void;
    trace: (msg: string, extra?: Record<string, any>) => void;
    fatal: (msg: string, extra?: Record<string, any>) => void;
};
declare const defaultLogger: {
    info: (msg: string, extra?: Record<string, any>) => void;
    error: (msg: string, extra?: Record<string, any>) => void;
    warn: (msg: string, extra?: Record<string, any>) => void;
    debug: (msg: string, extra?: Record<string, any>) => void;
    trace: (msg: string, extra?: Record<string, any>) => void;
    fatal: (msg: string, extra?: Record<string, any>) => void;
};

export { type LoggerOptions as L, createLogger as c, defaultLogger as d };
