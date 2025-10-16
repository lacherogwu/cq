import {
  ALS_KEY
} from "./chunk-GOZNIWMU.js";

// src/core/context.ts
import { AsyncLocalStorage } from "async_hooks";
if (!(ALS_KEY in globalThis)) {
  globalThis[ALS_KEY] = new AsyncLocalStorage();
}
var als = globalThis[ALS_KEY];
function getEvent() {
  const event = als.getStore();
  if (!event) {
    throw new Error("No event available. This function can only be called within an action handler.");
  }
  return event;
}
function runInContext(event, fn) {
  return new Promise((resolve, reject) => {
    als.run(event, async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  });
}

export {
  getEvent,
  runInContext
};
//# sourceMappingURL=chunk-345UGIAY.js.map