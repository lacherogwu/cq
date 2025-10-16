import { StandardSchemaV1 } from '@standard-schema/spec';

declare const ACTION_META_KEY = "__cq_meta";

type ActionType = 'query' | 'command';
type ActionDefinition<T extends ActionType = 'query' | 'command'> = {
    readonly type: T;
    readonly inputSchema: StandardSchemaV1 | null;
    readonly handler: (input?: any) => MaybePromise<any>;
};
type ActionMeta<T extends ActionType = 'query' | 'command'> = {
    readonly [ACTION_META_KEY]: ActionDefinition<T>;
};
interface ActionWithInput<T extends ActionType, Output, Schema extends StandardSchemaV1> extends ActionMeta<T> {
    (input: StandardSchemaV1.InferInput<Schema>): Promise<Output>;
}
interface ActionNoInput<T extends ActionType, Output> extends ActionMeta<T> {
    (): Promise<Output>;
}
type Action<T extends ActionType = 'query' | 'command', Output = any, Schema = undefined> = Schema extends StandardSchemaV1 ? ActionWithInput<T, Output, Schema> : ActionNoInput<T, Output>;
type ActionsRegistry = Map<string, Map<string, Action<ActionType, any, any>>>;
type MaybePromise<T> = T | Promise<T>;

export type { ActionType as A, MaybePromise as M, Action as a, ActionsRegistry as b };
