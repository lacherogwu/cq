import { defineHandler, H3 } from 'h3';
export { serve } from 'h3';
import { L as LoggerOptions } from '../../logger-Ce3rAycB.js';
export { c as createLogger, d as defaultLogger } from '../../logger-Ce3rAycB.js';
import { b as ActionsRegistry } from '../../types-BFKVvtAe.js';
import '@standard-schema/spec';

declare function makeServeStaticHandler(root: string): ReturnType<typeof defineHandler>;
declare function createH3App(actionsRegistry: ActionsRegistry, loggerOptions?: LoggerOptions): H3;

export { LoggerOptions, createH3App, makeServeStaticHandler };
