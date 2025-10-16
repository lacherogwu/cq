import type { StandardSchemaV1 } from '@standard-schema/spec';
import { ACTION_META_KEY } from './constants';

export type ActionType = 'query' | 'command';

export type ActionDefinition<T extends ActionType = 'query' | 'command'> = {
	readonly type: T;
	readonly inputSchema: StandardSchemaV1 | null;
	readonly handler: (input?: any) => MaybePromise<any>;
};

export type ActionMeta<T extends ActionType = 'query' | 'command'> = {
	readonly [ACTION_META_KEY]: ActionDefinition<T>;
};

export interface ActionWithInput<T extends ActionType, Output, Schema extends StandardSchemaV1> extends ActionMeta<T> {
	(input: StandardSchemaV1.InferInput<Schema>): Promise<Output>;
}

export interface ActionNoInput<T extends ActionType, Output> extends ActionMeta<T> {
	(): Promise<Output>;
}

export type Action<T extends ActionType = 'query' | 'command', Output = any, Schema = undefined> = Schema extends StandardSchemaV1 ? ActionWithInput<T, Output, Schema> : ActionNoInput<T, Output>;

export type ActionsRegistry = Map<string, Map<string, Action<ActionType, any, any>>>;

export type MaybePromise<T> = T | Promise<T>;
