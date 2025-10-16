import { API_PREFIX } from '../constants';
import { serializer } from '../serializer';
import type { ActionType } from '../types';

export function __cq_invoke_action(type: ActionType, action: string) {
	return async (input?: any) => {
		let url = API_PREFIX + action;
		if (type === 'query') {
			url += `?input=${serializer.serializeForQuery(input)}`;
		}
		const response = await fetch(url, {
			method: type === 'query' ? 'GET' : 'POST',
			headers: type === 'query' ? {} : { 'Content-Type': 'application/json' },
			body: type === 'command' && input !== undefined ? serializer.serialize(input) : undefined,
		});

		const text = await response.text();
		if (!response.ok) {
			const result = await Promise.resolve(text)
				.then(JSON.parse)
				.catch(() => null);
			console.error(`[cq] Error invoking action: ${action}`, result);
			throw new Error(result?.message || 'Unknown error');
		}
		const result = serializer.deserialize(text);

		return result;
	};
}
