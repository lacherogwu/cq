import type { StandardSchemaV1 } from '@standard-schema/spec';
import { ACTION_META_KEY } from './constants';

export type ActionType = 'query' | 'command';

export type ActionDefinition<T extends ActionType = 'query' | 'command', I extends StandardSchemaV1 | null = null> = {
	readonly type: T;
	readonly inputSchema: I;
	readonly handler: (input?: any) => MaybePromise<any>;
};

export type ActionMeta<T extends ActionType = 'query' | 'command', I extends StandardSchemaV1 | null = null> = {
	readonly [ACTION_META_KEY]: ActionDefinition<T, I>;
};

export interface ActionWithInput<T extends ActionType, Output, Schema extends StandardSchemaV1> extends ActionMeta<T, Schema> {
	(input: StandardSchemaV1.InferInput<Schema>): Promise<Output>;
}

export interface ActionNoInput<T extends ActionType, Output> extends ActionMeta<T> {
	(): Promise<Output>;
}

export type Action<T extends ActionType = 'query' | 'command', Output = any, Schema = undefined> = Schema extends StandardSchemaV1 ? ActionWithInput<T, Output, Schema> : ActionNoInput<T, Output>;

export type ActionsRegistry = Map<string, Map<string, Action<ActionType, any, any>>>;

export type MaybePromise<T> = T | Promise<T>;

export type ActionsClient<T> = T extends Record<string, any>
	? {
			[K in keyof T]: T[K] extends {
				readonly [ACTION_META_KEY]: {
					type: infer MT;
					inputSchema: infer MI;
				};
			}
				? MT extends 'query' | 'command'
					? {
							[A in MT]: MI extends StandardSchemaV1 //
								? (input: StandardSchemaV1.InferInput<MI>) => ReturnType<T[K]>
								: () => ReturnType<T[K]>;
					  }
					: never
				: ActionsClient<T[K]>;
	  }
	: never;
