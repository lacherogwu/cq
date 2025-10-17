import {
  ALS_KEY
} from "./chunk-GOZNIWMU.js";

// src/core/validation.ts
var VALIDATION_ERROR_BRAND = Symbol.for("@@ValidationError");
var ValidationError = class _ValidationError extends Error {
  [VALIDATION_ERROR_BRAND] = true;
  issues;
  constructor(message, issues) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues || [];
    Object.setPrototypeOf(this, _ValidationError.prototype);
  }
};
function isValidationError(error) {
  return typeof error === "object" && error !== null && VALIDATION_ERROR_BRAND in error && "issues" in error;
}
function createValidator(validateOrFn, maybeFn) {
  if (!maybeFn) {
    return (arg) => {
      if (arg !== void 0) {
        throw new ValidationError("This action does not accept any input");
      }
    };
  }
  if ("~standard" in validateOrFn) {
    return (arg) => {
      const validate = validateOrFn["~standard"].validate;
      const result = validate(arg);
      if (result.issues) {
        throw new ValidationError("Invalid input", result.issues);
      }
      return result.value;
    };
  }
  throw new ValidationError("Invalid validator passed");
}

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
  isValidationError,
  createValidator,
  getEvent,
  runInContext
};
//# sourceMappingURL=chunk-W54CBKQ7.js.map