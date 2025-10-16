import {
  serializer
} from "../../chunk-TLHMP4XM.js";
import {
  API_PREFIX
} from "../../chunk-GOZNIWMU.js";

// src/core/internals/client.ts
function __cq_invoke_action(type, action) {
  return async (input) => {
    let url = API_PREFIX + action;
    if (type === "query") {
      url += `?input=${serializer.serializeForQuery(input)}`;
    }
    const response = await fetch(url, {
      method: type === "query" ? "GET" : "POST",
      headers: type === "query" ? {} : { "Content-Type": "application/json" },
      body: type === "command" && input !== void 0 ? serializer.serialize(input) : void 0
    });
    const text = await response.text();
    if (!response.ok) {
      const result2 = await Promise.resolve(text).then(JSON.parse).catch(() => null);
      console.error(`[cq] Error invoking action: ${action}`, result2);
      throw new Error(result2?.message || "Unknown error");
    }
    const result = serializer.deserialize(text);
    return result;
  };
}
export {
  __cq_invoke_action
};
//# sourceMappingURL=client.js.map