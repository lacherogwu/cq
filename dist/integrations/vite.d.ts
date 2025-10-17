import { Plugin } from 'vite';
import { L as LoggerOptions } from '../logger-Ce3rAycB.js';

type CqViteOptions = {
    /**
     * Enable debug logging
     * @default false
     */
    debug?: boolean;
    /**
     * Logger configuration
     */
    logger?: LoggerOptions;
};
declare function cq(options?: CqViteOptions): Plugin;

export { type CqViteOptions, cq, cq as default };
