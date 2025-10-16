import { defineHandler, H3 } from 'h3';
export { serve } from 'h3';
import { b as ActionsRegistry } from '../../types-BFKVvtAe.js';
import '@standard-schema/spec';

declare function makeServeStaticHandler(): ReturnType<typeof defineHandler>;
declare function createH3App(actionsRegistry: ActionsRegistry): H3;

export { createH3App, makeServeStaticHandler };
