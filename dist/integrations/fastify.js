import {
  convertActionsObjectToRegistry,
  createH3App
} from "../chunk-AGSBHUSU.js";
import "../chunk-W54CBKQ7.js";
import "../chunk-TLHMP4XM.js";
import {
  ACTION_META_KEY,
  API_PREFIX
} from "../chunk-GOZNIWMU.js";

// src/integrations/fastify.ts
import fp from "fastify-plugin";
import { Readable } from "stream";
var cqFastify = fp((fastify, opts, done) => {
  const { actions } = opts;
  fastify.removeContentTypeParser("application/json");
  fastify.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done2) => {
    done2(null, body);
  });
  const actionsRegistry = convertActionsObjectToRegistry(actions);
  const h3App = createH3App(actionsRegistry);
  actionsRegistry.forEach((actions2, moduleKey) => {
    actions2.forEach((action, actionKey) => {
      const url = `${API_PREFIX}${moduleKey}${moduleKey === "" ? "" : "/"}${actionKey}`;
      const method = action[ACTION_META_KEY].type === "query" ? "GET" : "POST";
      fastify.route({
        url,
        method,
        handler: async (req, reply) => {
          const response = await h3App.request(req.url, {
            method: req.method,
            headers: req.headers,
            body: req.body
          });
          reply.status(response.status);
          response.headers.forEach((value, key) => {
            reply.header(key, value);
          });
          if (response.body) {
            const stream = Readable.fromWeb(response.body);
            return reply.send(stream);
          } else {
            return reply.send();
          }
        }
      });
    });
  });
  done();
});
export {
  cqFastify
};
//# sourceMappingURL=fastify.js.map