import * as fastify from 'fastify';
import { d as ActionsMap } from '../types-4mTTYEQa.js';
import '@standard-schema/spec';

type FastifyPluginOptions = {
    actions: ActionsMap;
};
declare const cqFastify: fastify.FastifyPluginCallback<FastifyPluginOptions, fastify.RawServerDefault, fastify.FastifyTypeProviderDefault, fastify.FastifyBaseLogger>;

export { cqFastify };
