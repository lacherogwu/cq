import {
  isValidationError,
  runInContext
} from "./chunk-W54CBKQ7.js";
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
import { performance } from "perf_hooks";

// src/core/logger.ts
import colors from "picocolors";
import { inspect } from "util";
var LOG_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
};
function createLogger(options = {}) {
  const { level = "info", label = "CQ", format = "pretty" } = options;
  const currentLogLevel = LOG_LEVELS[level];
  const formatTimestamp = () => {
    return (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };
  const msgFormatMap = {
    "Action started": "\u2192",
    "Action completed successfully": "\u2713",
    "Action failed with HTTP error": "\u26A0",
    "Action failed with validation error": "\u26A0",
    "Action failed with internal error": "\u2717"
  };
  const log = (logLevel, msg, extra) => {
    if (LOG_LEVELS[logLevel] < currentLogLevel) return;
    if (format === "json") {
      const logEntry = {
        level: LOG_LEVELS[logLevel],
        time: Date.now(),
        service: label,
        msg,
        ...extra
      };
      console.log(JSON.stringify(logEntry));
      return;
    }
    const timestamp = formatTimestamp();
    const coloredTime = colors.dim(timestamp);
    const coloredLabel = colors.bold(colors.cyan(`[${label}]`));
    let formattedMsg = msg;
    let extraInfo = "";
    if (extra) {
      if (extra.module && extra.action) {
        const actionPath = `${colors.blue(extra.module)}/${colors.green(extra.action)}`;
        formattedMsg = `${msgFormatMap[msg] || msg} ${actionPath}`;
      }
      if (extra.type) {
        extraInfo += ` ${colors.magenta(extra.type)}`;
      }
      if (extra.input !== void 0) {
        if (extra.input === "[large payload]") {
          extraInfo += ` ${colors.dim("[large payload]")}`;
        } else {
          const inputStr = inspect(extra.input, {
            colors: false,
            compact: true,
            depth: 2,
            breakLength: Infinity
          });
          extraInfo += ` ${colors.dim(inputStr)}`;
        }
      }
      if (extra.duration) {
        extraInfo += ` ${colors.gray(`(${extra.duration})`)}`;
      }
      if (extra.error) {
        extraInfo += ` ${colors.red(extra.error)}`;
      }
      if (extra.status) {
        extraInfo += ` ${colors.yellow(extra.status)}`;
      }
    }
    const logLine = `${coloredTime} ${coloredLabel} ${formattedMsg}${extraInfo}`;
    switch (logLevel) {
      case "error":
      case "fatal":
        console.error(logLine);
        break;
      case "warn":
        console.warn(logLine);
        break;
      default:
        console.log(logLine);
        break;
    }
  };
  return {
    info: (msg, extra) => log("info", msg, extra),
    error: (msg, extra) => log("error", msg, extra),
    warn: (msg, extra) => log("warn", msg, extra),
    debug: (msg, extra) => log("debug", msg, extra),
    trace: (msg, extra) => log("trace", msg, extra),
    fatal: (msg, extra) => log("fatal", msg, extra)
  };
}
var defaultLogger = createLogger();

// src/core/internals/server.ts
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
function makeCqRequestHandler(actionsRegistry, loggerOptions) {
  const logger = loggerOptions ? createLogger(loggerOptions) : defaultLogger;
  return defineHandler(async (event) => {
    assertMethod(event, ["GET", "POST"]);
    const { req } = event;
    const url = req.url?.split(API_PREFIX)[1];
    const pathname = url?.split("?")[0];
    const separatorIndex = pathname?.lastIndexOf("/") ?? -1;
    const moduleKey = pathname?.slice(0, separatorIndex);
    const actionKey = pathname?.slice(separatorIndex + 1);
    if (!moduleKey || !actionKey) {
      logger.warn("Request failed: Module or action not found", {
        url: req.url,
        pathname
      });
      throw HTTPError.status(404, "Not Found", {
        message: "Module or action not found"
      });
    }
    const mod = actionsRegistry.get(moduleKey);
    if (!mod) {
      logger.warn("Module not found", {
        module: moduleKey,
        action: actionKey
      });
      throw HTTPError.status(404, "Module Not Found", {
        message: "The specified module could not be found"
      });
    }
    const action = mod.get(actionKey);
    if (!action) {
      logger.warn("Action not found", {
        module: moduleKey,
        action: actionKey
      });
      throw HTTPError.status(404, "Action Not Found", {
        message: "The specified action could not be found"
      });
    }
    const expectedMethod = action[ACTION_META_KEY].type === "query" ? "GET" : "POST";
    assertMethod(event, expectedMethod);
    const startTime = performance.now();
    try {
      const input = await getRequestInput(event);
      const logData = {
        module: moduleKey,
        action: actionKey,
        type: action[ACTION_META_KEY].type
      };
      if (input !== void 0 && input !== null) {
        const inputStr = JSON.stringify(input);
        if (inputStr.length < 500) {
          logData.input = input;
        } else {
          logData.input = "[large payload]";
        }
      }
      logger.info("Action started", logData);
      const result = await runInContext(event, async () => await action(input));
      const duration = performance.now() - startTime;
      logger.info("Action completed successfully", {
        module: moduleKey,
        action: actionKey,
        duration: `${+duration.toFixed(2)}ms`
      });
      return new Response(serializer.serialize(result), {
        headers: {
          "content-type": "application/json;charset=UTF-8"
        }
      });
    } catch (err) {
      const duration = +(performance.now() - startTime).toFixed(2);
      if (err instanceof HTTPError) {
        logger.warn("Action failed with HTTP error", {
          module: moduleKey,
          action: actionKey,
          duration: `${duration}ms`,
          status: err.status,
          error: err.message
        });
        throw err;
      }
      if (isValidationError(err)) {
        logger.warn("Action failed with validation error", {
          module: moduleKey,
          action: actionKey,
          duration: `${duration}ms`,
          error: err.message,
          issues: err.issues
        });
        throw HTTPError.status(400, "Bad Request", {
          message: "Validation Error",
          body: { issues: err.issues }
        });
      }
      logger.error("Action failed with internal error", {
        module: moduleKey,
        action: actionKey,
        duration: `${duration}ms`,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : void 0
      });
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
function createH3App(actionsRegistry, loggerOptions) {
  const app = new H3();
  app.use(`${API_PREFIX}**`, makeCqRequestHandler(actionsRegistry, loggerOptions));
  return app;
}

export {
  createLogger,
  defaultLogger,
  makeServeStaticHandler,
  createH3App,
  serve
};
//# sourceMappingURL=chunk-HHDK2VMI.js.map