import { serializer } from './serializer';
import type { ActionsClient, ActionType } from './types';
import { API_PREFIX } from './constants';

type ProxyCallbackOpts = {
	path: string[];
	args: unknown[];
};
type ProxyCallback = (opts: ProxyCallbackOpts) => unknown;

function createInnerProxy(callback: ProxyCallback, path: string[] = []): any {
	return new Proxy(() => {}, {
		get(_target, prop: string): any {
			return createInnerProxy(callback, path.concat(prop));
		},
		async apply(_target, _thisArg, args) {
			return await callback({ path, args });
		},
	});
}

type HTTPHeaders = Record<string, string[] | string | undefined>;

type Opts = {
	url?: string;
	headers?: HTTPHeaders | (() => HTTPHeaders | Promise<HTTPHeaders>);
} & DoHttpCallHooks;

export function createActionsClient<T>(opts?: Opts): ActionsClient<T> {
	const { url, headers } = opts || {};

	const getHeaders = async () => {
		if (typeof headers === 'function') {
			return headers();
		}
		return headers;
	};

	return createInnerProxy(async ({ path, args }) => {
		const [input] = args;
		const actionType = path.at(-1);
		assertsActionType(actionType);
		const actionPath = path.slice(0, -1).join('/');

		return doHttpCall({
			baseUrl: url,
			actionType,
			actionPath,
			input,
			headers: await getHeaders(),
			onRequest: opts?.onRequest,
			onResponse: opts?.onResponse,
			onError: opts?.onError,
		});
	});
}

function assertsActionType(type?: string): asserts type is ActionType {
	if (type !== 'query' && type !== 'command') {
		throw new Error(`Invalid action type: ${type}`);
	}
}

type DoHttpCallParams = {
	baseUrl?: string;
	actionType: ActionType;
	actionPath: string;
	input?: any;
	headers?: HTTPHeaders;
} & DoHttpCallHooks;

type DoHttpCallHooks = {
	onRequest?: (params: { type: ActionType; action: string; input?: any }) => void;
	onResponse?: (result: { type: ActionType; action: string; result: any }) => void;
	onError?: (result: { type: ActionType; action: string; result: Record<string, any> | null }) => void;
};

export async function doHttpCall(params: DoHttpCallParams): Promise<any> {
	const { baseUrl = '', actionType, actionPath, input, headers } = params;

	let finalUrl = baseUrl;
	if (finalUrl.endsWith('/')) {
		finalUrl = finalUrl.slice(0, -1);
	}
	finalUrl += API_PREFIX + actionPath;
	if (actionType === 'query') {
		finalUrl += `?input=${serializer.serializeForQuery(input)}`;
	}

	const finalHeaders: HTTPHeaders = {
		...headers,
	};
	if (actionType === 'command') {
		finalHeaders['Content-Type'] = 'application/json';
	}

	params?.onRequest?.({
		type: actionType,
		action: actionPath,
		input,
	});

	const response = await fetch(finalUrl, {
		method: actionType === 'query' ? 'GET' : 'POST',
		headers: convertHeaders(finalHeaders),
		body: actionType === 'command' && input !== undefined ? serializer.serialize(input) : undefined,
	});

	const text = await response.text();
	if (!response.ok) {
		const result = await Promise.resolve(text)
			.then(JSON.parse)
			.catch(() => null);
		params?.onError?.({
			type: actionType,
			action: actionPath,
			result,
		});
		console.error(`[cq] Error invoking action: ${actionPath}`, result);
		throw new Error(result?.message || 'Unknown error');
	}
	const result = serializer.deserialize(text);
	params?.onResponse?.({
		type: actionType,
		action: actionPath,
		result,
	});

	return result;
}

function convertHeaders(headers: HTTPHeaders): HeadersInit {
	const result: HeadersInit = {};
	for (const key in headers) {
		const value = headers[key];
		if (Array.isArray(value)) {
			result[key] = value.join(', ');
		} else if (value !== undefined) {
			result[key] = value;
		}
	}
	return result;
}
