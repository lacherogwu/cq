import {
  doHttpCall
} from "../../chunk-JGSZPT3B.js";
import "../../chunk-TLHMP4XM.js";
import "../../chunk-GOZNIWMU.js";

// src/core/internals/client.ts
function __cq_invoke_action(type, action) {
  return async (input) => await doHttpCall({
    actionType: type,
    actionPath: action,
    input
  });
}
export {
  __cq_invoke_action
};
//# sourceMappingURL=client.js.map