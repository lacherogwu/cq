import {
  getEvent
} from "../chunk-345UGIAY.js";
import {
  ACTION_META_KEY
} from "../chunk-GOZNIWMU.js";

// src/core/index.ts
import { HTTPError, getCookie, getRequestFingerprint, getRequestHost, getRequestIP, getRequestProtocol, getRequestURL, getQuery } from "h3";

// src/core/actions.ts
function createValidator(validateOrFn, maybeFn) {
  if (!maybeFn) {
    return (arg) => {
      if (arg !== void 0) {
        throw new Error("This action does not accept any input");
      }
    };
  }
  if ("~standard" in validateOrFn) {
    return (arg) => {
      const validate = validateOrFn["~standard"].validate;
      const result = validate(arg);
      if (result.issues) {
        throw new Error("Invalid input: " + JSON.stringify(result.issues));
      }
      return result.value;
    };
  }
  throw new Error("Invalid validator passed");
}
function createAction(type) {
  return (validateOrFn, maybeFn) => {
    const fn = maybeFn || validateOrFn;
    const inputSchema = maybeFn ? validateOrFn : null;
    const validate = createValidator(validateOrFn, maybeFn);
    const action = (input) => {
      if (inputSchema) {
        input = validate(input);
      }
      return fn(input);
    };
    Object.defineProperty(action, ACTION_META_KEY, {
      value: {
        type,
        inputSchema,
        handler: action
      },
      enumerable: false,
      writable: false
    });
    return action;
  };
}
var query = createAction("query");
var command = createAction("command");
export {
  HTTPError,
  command,
  getCookie,
  getEvent,
  getQuery,
  getRequestFingerprint,
  getRequestHost,
  getRequestIP,
  getRequestProtocol,
  getRequestURL,
  query
};
//# sourceMappingURL=index.js.map