import { defineHandler, H3 } from 'h3';
export { serve } from 'h3';
import { L as LoggerOptions } from '../../logger-Ce3rAycB.js';
export { c as createLogger, d as defaultLogger } from '../../logger-Ce3rAycB.js';
import { c as ActionsRegistry, d as ActionsMap } from '../../types-4mTTYEQa.js';
import '@standard-schema/spec';

declare function makeServeStaticHandler(root: string): ReturnType<typeof defineHandler>;
declare function createH3App(actionsRegistry: ActionsRegistry, loggerOptions?: LoggerOptions): H3;
declare function convertActionsObjectToRegistry(actions: ActionsMap): ActionsRegistry;

export { LoggerOptions, convertActionsObjectToRegistry, createH3App, makeServeStaticHandler };
