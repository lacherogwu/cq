import type { ActionsClient } from './types';

type Opts = {
	baseURL?: string;
};

export function createActionsClient<T>(opts?: Opts): ActionsClient<T> {
	return '' as any;
}
