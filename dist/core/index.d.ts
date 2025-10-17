import { H3Event } from 'h3';
export { H3Event, HTTPError, getCookie, getQuery, getRequestFingerprint, getRequestHost, getRequestIP, getRequestProtocol, getRequestURL } from 'h3';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { A as ActionType, M as MaybePromise, a as Action } from '../types-BFKVvtAe.js';
export { b as ActionsRegistry } from '../types-BFKVvtAe.js';

type CreateAction<T extends ActionType> = {
    <Output>(fn: () => MaybePromise<Output>): Action<T, Output>;
    <Schema extends StandardSchemaV1, Output>(inputSchema: Schema, fn: (input: StandardSchemaV1.InferInput<Schema>) => MaybePromise<Output>): Action<T, Output, Schema>;
};
declare const query: CreateAction<"query">;
declare const command: CreateAction<"command">;

declare function getEvent(): H3Event;

export { Action, ActionType, command, getEvent, query };
