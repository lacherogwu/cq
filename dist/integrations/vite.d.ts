import { Plugin } from 'vite';

type CqViteOptions = {
    /**
     * Enable debug logging
     * @default false
     */
    debug?: boolean;
};
declare function cq(options?: CqViteOptions): Plugin;

export { type CqViteOptions, cq, cq as default };
