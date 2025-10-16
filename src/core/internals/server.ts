import { assertMethod, defineHandler, H3, HTTPError, serveStatic, type H3Event } from 'h3';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ACTION_META_KEY, API_PREFIX } from '../constants';
import { runInContext } from '../context';
import { serializer } from '../serializer';
import type { ActionsRegistry } from '../types';
export { serve } from 'h3';

async function getRequestInput(event: H3Event): Promise<any> {
	if (event.req.method === 'POST') {
		return serializer.deserialize(await event.req.text());
	} else {
		const inputParam = event.url.searchParams.get('input');
		if (!inputParam) return undefined;
		return serializer.deserializeFromQuery(inputParam);
	}
}

function makeCqRequestHandler(actionsRegistry: ActionsRegistry) {
	return defineHandler(async event => {
		assertMethod(event, ['GET', 'POST']);

		const { req } = event;
		const url = req.url?.split(API_PREFIX)[1];
		const pathname = url?.split('?')[0];
		const separatorIndex = pathname?.lastIndexOf('/') ?? -1;
		const moduleKey = pathname?.slice(0, separatorIndex);
		const actionKey = pathname?.slice(separatorIndex + 1);

		if (!moduleKey || !actionKey) {
			throw HTTPError.status(404, 'Not Found', {
				message: 'Module or action not found',
			});
		}

		const mod = actionsRegistry.get(moduleKey);
		if (!mod) {
			throw HTTPError.status(404, 'Module Not Found', {
				message: 'The specified module could not be found',
			});
		}

		const action = mod.get(actionKey);
		if (!action) {
			throw HTTPError.status(404, 'Action Not Found', {
				message: 'The specified action could not be found',
			});
		}

		const expectedMethod = action[ACTION_META_KEY].type === 'query' ? 'GET' : 'POST';
		assertMethod(event, expectedMethod);

		try {
			const input = await getRequestInput(event);
			const result = await runInContext(event, async () => await action(input));

			return new Response(serializer.serialize(result), {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
			});
		} catch (err) {
			if (err instanceof HTTPError) {
				throw err;
			}

			throw HTTPError.status(500, 'Internal Server Error');
		}
	});
}

export function makeServeStaticHandler(): ReturnType<typeof defineHandler> {
	return defineHandler(event =>
		serveStatic(event, {
			indexNames: ['/index.html'],
			// @ts-ignore
			getContents: id => fs.readFile(path.join(import.meta.dirname, 'client', id)).catch(() => fs.readFile(path.join(import.meta.dirname, 'client', 'index.html'))),
			getMeta: async id => {
				const stats = await fs.stat(path.join(import.meta.dirname, 'client', id)).catch(() => fs.stat(path.join(import.meta.dirname, 'client', 'index.html')).catch(() => null));
				if (stats?.isFile()) {
					return {
						size: stats.size,
						mtime: stats.mtimeMs,
					};
				}
			},
		}),
	);
}

export function createH3App(actionsRegistry: ActionsRegistry) {
	const app = new H3();
	app.use(`${API_PREFIX}**`, makeCqRequestHandler(actionsRegistry));
	return app;
}
