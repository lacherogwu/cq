import type { StandardSchemaV1 } from '@standard-schema/spec';
import { ACTION_META_KEY } from './constants';
import type { Action, ActionType, MaybePromise } from './types';

function createValidator(validateOrFn: any, maybeFn?: any) {
	if (!maybeFn) {
		return (arg: any) => {
			if (arg !== undefined) {
				throw new Error('This action does not accept any input');
			}
		};
	}

	if ('~standard' in validateOrFn) {
		return (arg: any) => {
			const validate = validateOrFn['~standard'].validate;
			const result = validate(arg);
			if (result.issues) {
				console.dir(result, { depth: Infinity });
				throw new Error('Invalid input: ' + JSON.stringify(result.issues));
			}

			return result.value;
		};
	}

	throw new Error('Invalid validator passed');
}

type CreateAction<T extends ActionType> = {
	<Output>(fn: () => MaybePromise<Output>): Action<T, Output>;
	<Schema extends StandardSchemaV1, Output>(inputSchema: Schema, fn: (input: StandardSchemaV1.InferInput<Schema>) => MaybePromise<Output>): Action<T, Output, Schema>;
};

function createAction<T extends ActionType>(type: T): CreateAction<T> {
	return (validateOrFn: any, maybeFn?: any) => {
		const fn = maybeFn || validateOrFn;
		const inputSchema = maybeFn ? validateOrFn : null;
		const validate = createValidator(validateOrFn, maybeFn);

		const action = (input?: any) => {
			if (inputSchema) {
				input = validate(input);
			}

			return fn(input);
		};

		Object.defineProperty(action, ACTION_META_KEY, {
			value: {
				type,
				inputSchema,
				handler: action,
			},
			enumerable: false,
			writable: false,
		});

		return action as any;
	};
}

export const query = createAction('query');
export const command = createAction('command');
