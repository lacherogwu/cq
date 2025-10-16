import {
  runInContext
} from "./chunk-345UGIAY.js";
import {
  serializer
} from "./chunk-TLHMP4XM.js";
import {
  ACTION_META_KEY,
  API_PREFIX
} from "./chunk-GOZNIWMU.js";

// src/core/internals/server.ts
import { assertMethod, defineHandler, H3, HTTPError, serveStatic } from "h3";
import fs from "fs/promises";
import path from "path";
import { serve } from "h3";
async function getRequestInput(event) {
  if (event.req.method === "POST") {
    return serializer.deserialize(await event.req.text());
  } else {
    const inputParam = event.url.searchParams.get("input");
    if (!inputParam) return void 0;
    return serializer.deserializeFromQuery(inputParam);
  }
}
function makeCqRequestHandler(actionsRegistry) {
  return defineHandler(async (event) => {
    assertMethod(event, ["GET", "POST"]);
    const { req } = event;
    const url = req.url?.split(API_PREFIX)[1];
    const pathname = url?.split("?")[0];
    const separatorIndex = pathname?.lastIndexOf("/") ?? -1;
    const moduleKey = pathname?.slice(0, separatorIndex);
    const actionKey = pathname?.slice(separatorIndex + 1);
    if (!moduleKey || !actionKey) {
      throw HTTPError.status(404, "Not Found", {
        message: "Module or action not found"
      });
    }
    const mod = actionsRegistry.get(moduleKey);
    if (!mod) {
      throw HTTPError.status(404, "Module Not Found", {
        message: "The specified module could not be found"
      });
    }
    const action = mod.get(actionKey);
    if (!action) {
      throw HTTPError.status(404, "Action Not Found", {
        message: "The specified action could not be found"
      });
    }
    const expectedMethod = action[ACTION_META_KEY].type === "query" ? "GET" : "POST";
    assertMethod(event, expectedMethod);
    try {
      const input = await getRequestInput(event);
      const result = await runInContext(event, async () => await action(input));
      return new Response(serializer.serialize(result), {
        headers: {
          "content-type": "application/json;charset=UTF-8"
        }
      });
    } catch (err) {
      if (err instanceof HTTPError) {
        throw err;
      }
      console.error(err);
      throw HTTPError.status(500, "Internal Server Error");
    }
  });
}
function makeServeStaticHandler(root) {
  const getClientFilePath = (filepath) => path.join(root, "client", filepath);
  return defineHandler(
    (event) => serveStatic(event, {
      indexNames: ["/index.html"],
      getContents: async (id) => fs.readFile(getClientFilePath(id)).catch(() => fs.readFile(getClientFilePath("index.html"))),
      getMeta: async (id) => {
        const stats = await fs.stat(getClientFilePath(id)).catch(() => fs.stat(getClientFilePath("index.html")).catch(() => null));
        if (stats?.isFile()) {
          return {
            size: stats.size,
            mtime: stats.mtimeMs
          };
        }
      }
    })
  );
}
function createH3App(actionsRegistry) {
  const app = new H3();
  app.use(`${API_PREFIX}**`, makeCqRequestHandler(actionsRegistry));
  return app;
}

export {
  makeServeStaticHandler,
  createH3App,
  serve
};
//# sourceMappingURL=chunk-K3C3SH74.js.map