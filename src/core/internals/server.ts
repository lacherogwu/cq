import { assertMethod, defineHandler, H3, HTTPError, serveStatic, type H3Event } from 'h3';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ACTION_META_KEY, API_PREFIX } from '../constants';
import { runInContext } from '../context';
import { createLogger, defaultLogger, type LoggerOptions } from '../logger';
import { serializer } from '../serializer';
import type { ActionsRegistry } from '../types';
export { serve } from 'h3';
export { createLogger, defaultLogger, type LoggerOptions } from '../logger';

async function getRequestInput(event: H3Event): Promise<any> {
	if (event.req.method === 'POST') {
		return serializer.deserialize(await event.req.text());
	} else {
		const inputParam = event.url.searchParams.get('input');
		if (!inputParam) return undefined;
		return serializer.deserializeFromQuery(inputParam);
	}
}

function makeCqRequestHandler(actionsRegistry: ActionsRegistry, loggerOptions?: LoggerOptions) {
	const logger = loggerOptions ? createLogger(loggerOptions) : defaultLogger;

	return defineHandler(async event => {
		assertMethod(event, ['GET', 'POST']);

		const { req } = event;
		const url = req.url?.split(API_PREFIX)[1];
		const pathname = url?.split('?')[0];
		const separatorIndex = pathname?.lastIndexOf('/') ?? -1;
		const moduleKey = pathname?.slice(0, separatorIndex);
		const actionKey = pathname?.slice(separatorIndex + 1);

		if (!moduleKey || !actionKey) {
			logger.warn('Request failed: Module or action not found', {
				url: req.url,
				pathname,
			});
			throw HTTPError.status(404, 'Not Found', {
				message: 'Module or action not found',
			});
		}

		const mod = actionsRegistry.get(moduleKey);
		if (!mod) {
			logger.warn('Module not found', {
				module: moduleKey,
				action: actionKey,
			});
			throw HTTPError.status(404, 'Module Not Found', {
				message: 'The specified module could not be found',
			});
		}

		const action = mod.get(actionKey);
		if (!action) {
			logger.warn('Action not found', {
				module: moduleKey,
				action: actionKey,
			});
			throw HTTPError.status(404, 'Action Not Found', {
				message: 'The specified action could not be found',
			});
		}

		const expectedMethod = action[ACTION_META_KEY].type === 'query' ? 'GET' : 'POST';
		assertMethod(event, expectedMethod);

		const startTime = Date.now();

		try {
			const input = await getRequestInput(event);

			const logData: any = {
				module: moduleKey,
				action: actionKey,
				type: action[ACTION_META_KEY].type,
			};

			if (input !== undefined && input !== null) {
				const inputStr = JSON.stringify(input);
				if (inputStr.length < 500) {
					logData.input = input;
				} else {
					logData.input = '[large payload]';
				}
			}

			logger.info('Action started', logData);

			const result = await runInContext(event, async () => await action(input));

			const duration = Date.now() - startTime;
			logger.info('Action completed successfully', {
				module: moduleKey,
				action: actionKey,
				duration: `${duration}ms`,
			});

			return new Response(serializer.serialize(result), {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
			});
		} catch (err) {
			// TODO: check if validation error
			console.log(err);

			const duration = Date.now() - startTime;

			if (err instanceof HTTPError) {
				logger.warn('Action failed with HTTP error', {
					module: moduleKey,
					action: actionKey,
					duration: `${duration}ms`,
					status: err.status,
					error: err.message,
				});
				throw err;
			}

			logger.error('Action failed with internal error', {
				module: moduleKey,
				action: actionKey,
				duration: `${duration}ms`,
				error: err instanceof Error ? err.message : String(err),
				stack: err instanceof Error ? err.stack : undefined,
			});

			throw HTTPError.status(500, 'Internal Server Error');
		}
	});
}

export function makeServeStaticHandler(root: string): ReturnType<typeof defineHandler> {
	// TODO: handle cases where user changes the build outDir
	const getClientFilePath = (filepath: string) => path.join(root, 'client', filepath);
	return defineHandler(event =>
		serveStatic(event, {
			indexNames: ['/index.html'],
			getContents: async id => fs.readFile(getClientFilePath(id)).catch(() => fs.readFile(getClientFilePath('index.html'))) as any,
			getMeta: async id => {
				const stats = await fs.stat(getClientFilePath(id)).catch(() => fs.stat(getClientFilePath('index.html')).catch(() => null));
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

export function createH3App(actionsRegistry: ActionsRegistry, loggerOptions?: LoggerOptions) {
	const app = new H3();
	app.use(`${API_PREFIX}**`, makeCqRequestHandler(actionsRegistry, loggerOptions));
	return app;
}
