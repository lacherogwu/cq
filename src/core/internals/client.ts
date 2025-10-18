import type { ActionType } from '../types';
import { doHttpCall } from '../client';

export function __cq_invoke_action(type: ActionType, action: string) {
	return async (input?: any) =>
		await doHttpCall({
			actionType: type,
			actionPath: action,
			input,
		});
}
