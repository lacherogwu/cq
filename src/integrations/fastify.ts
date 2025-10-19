import fp from 'fastify-plugin';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import { ACTION_META_KEY, API_PREFIX } from '../core/constants';
import { convertActionsObjectToRegistry, createH3App } from '../core/internals/server';
import type { ActionsMap } from '../core/types';

type FastifyPluginOptions = {
	actions: ActionsMap;
	// onError?: (result: Record<string, any>, err: Error) => any;
};

export const cqFastify = fp<FastifyPluginOptions>((fastify, opts, done) => {
	const { actions } = opts;

	fastify.removeContentTypeParser('application/json');
	fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
		done(null, body);
	});

	const actionsRegistry = convertActionsObjectToRegistry(actions);
	const h3App = createH3App(actionsRegistry);

	actionsRegistry.forEach((actions, moduleKey) => {
		actions.forEach((action, actionKey) => {
			const url = `${API_PREFIX}${moduleKey}${moduleKey === '' ? '' : '/'}${actionKey}`;
			const method = action[ACTION_META_KEY].type === 'query' ? 'GET' : 'POST';
			fastify.route({
				url,
				method,
				handler: async (req, reply) => {
					const response = await h3App.request(req.url, {
						method: req.method,
						headers: req.headers as Record<string, string>,
						body: req.body as any,
					});

					reply.status(response.status);
					response.headers.forEach((value, key) => {
						reply.header(key, value);
					});
					if (response.body) {
						const stream = Readable.fromWeb(response.body as ReadableStream);
						return reply.send(stream);
					} else {
						return reply.send();
					}
				},
			});
		});
	});

	done();
});
