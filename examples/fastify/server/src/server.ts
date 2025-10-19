import Fastify from 'fastify';
import cors from '@fastify/cors';
import { actions } from './actions';
import { cqFastify } from '@lachero/cq/fastify';

const fastify = Fastify({
	logger: true,
});

await fastify.register(cors, {
	origin: '*',
});

fastify.get('/', function (request, reply) {
	reply.send({ hello: 'world' });
});

fastify.register(cqFastify, {
	actions,
});

// Run the server!
fastify.listen({ port: 3000 }, function (err, address) {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	// Server is now listening on ${address}
});
