import {
  serializer
} from "./chunk-TLHMP4XM.js";
import {
  API_PREFIX
} from "./chunk-GOZNIWMU.js";

// src/core/client.ts
function createInnerProxy(callback, path = []) {
  return new Proxy(() => {
  }, {
    get(_target, prop) {
      return createInnerProxy(callback, path.concat(prop));
    },
    async apply(_target, _thisArg, args) {
      return await callback({ path, args });
    }
  });
}
function createActionsClient(opts) {
  const { url, headers } = opts || {};
  const getHeaders = async () => {
    if (typeof headers === "function") {
      return headers();
    }
    return headers;
  };
  return createInnerProxy(async ({ path, args }) => {
    const [input] = args;
    const actionType = path.at(-1);
    assertsActionType(actionType);
    const actionPath = path.slice(0, -1).join("/");
    return doHttpCall({
      baseUrl: url,
      actionType,
      actionPath,
      input,
      headers: await getHeaders(),
      onRequest: opts?.onRequest,
      onResponse: opts?.onResponse,
      onError: opts?.onError
    });
  });
}
function assertsActionType(type) {
  if (type !== "query" && type !== "command") {
    throw new Error(`Invalid action type: ${type}`);
  }
}
async function doHttpCall(params) {
  const { baseUrl = "", actionType, actionPath, input, headers } = params;
  let finalUrl = baseUrl;
  if (finalUrl.endsWith("/")) {
    finalUrl = finalUrl.slice(0, -1);
  }
  finalUrl += API_PREFIX + actionPath;
  if (actionType === "query") {
    finalUrl += `?input=${serializer.serializeForQuery(input)}`;
  }
  const finalHeaders = {
    ...headers
  };
  if (actionType === "command") {
    finalHeaders["Content-Type"] = "application/json";
  }
  params?.onRequest?.({
    type: actionType,
    action: actionPath,
    input
  });
  const response = await fetch(finalUrl, {
    method: actionType === "query" ? "GET" : "POST",
    headers: convertHeaders(finalHeaders),
    body: actionType === "command" && input !== void 0 ? serializer.serialize(input) : void 0
  });
  const text = await response.text();
  if (!response.ok) {
    const result2 = await Promise.resolve(text).then(JSON.parse).catch(() => null);
    params?.onError?.({
      type: actionType,
      action: actionPath,
      result: result2
    });
    console.error(`[cq] Error invoking action: ${actionPath}`, result2);
    throw new Error(result2?.message || "Unknown error");
  }
  const result = serializer.deserialize(text);
  params?.onResponse?.({
    type: actionType,
    action: actionPath,
    result
  });
  return result;
}
function convertHeaders(headers) {
  const result = {};
  for (const key in headers) {
    const value = headers[key];
    if (Array.isArray(value)) {
      result[key] = value.join(", ");
    } else if (value !== void 0) {
      result[key] = value;
    }
  }
  return result;
}

export {
  createActionsClient,
  doHttpCall
};
//# sourceMappingURL=chunk-JGSZPT3B.js.map