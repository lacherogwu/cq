import glob from 'fast-glob';
import type { H3 } from 'h3';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import type { ReadableStream } from 'node:stream/web';
import picocolors from 'picocolors';
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import * as vite from 'vite';
import { ACTION_META_KEY, API_PREFIX, PLUGIN_NAME } from '../core/constants';
import { createH3App } from '../core/internals/server';
import type { LoggerOptions } from '../core/logger';
import type { Action, ActionsRegistry } from '../core/types';

export type CqViteOptions = {
	/**
	 * Enable debug logging
	 * @default false
	 */
	debug?: boolean;
	/**
	 * Logger configuration
	 */
	logger?: LoggerOptions;
};

export function cq(options: CqViteOptions = {}): Plugin {
	const serverPattern = /\.server\.(js|ts|mjs|mts)$/;
	const debug = options.debug || false;

	let viteServer: ViteDevServer;
	let actionsRegistry: ActionsRegistry;
	let config: ResolvedConfig;
	let h3App: H3;
	let log: (msg: string) => void;

	return {
		name: PLUGIN_NAME,
		enforce: 'pre',

		config(userConfig, env) {
			if (env.command === 'build' && !userConfig.build?.ssr) {
				return {
					build: {
						outDir: userConfig.build?.outDir || 'dist/client',
					},
				};
			}
		},

		configResolved(resolvedConfig) {
			config = resolvedConfig;
			log = (msg: string) => {
				const tag = picocolors.magenta(`[${PLUGIN_NAME}]`);
				config.logger.info(`${tag} ${msg}`, { timestamp: true });
			};
		},

		async configureServer(server) {
			viteServer = server;
			actionsRegistry = await createActionsRegistry({ viteServer, debug, log });

			const loggerOptions = options.logger || { format: 'pretty' };
			h3App = createH3App(actionsRegistry, loggerOptions);

			viteServer.middlewares.use(async (req, res, next) => {
				if (!req.url?.startsWith(API_PREFIX)) {
					return next();
				}

				const response = await h3App.request(req.url, {
					method: req.method,
					headers: req.headers as Record<string, string>,
					body: req.method === 'POST' ? await text(req) : undefined,
				});

				res.statusCode = response.status;
				res.setHeaders(response.headers);

				if (response.body) {
					const stream = Readable.fromWeb(response.body as ReadableStream);
					stream.pipe(res);
				} else {
					res.end();
				}
			});
		},

		// this is used for the transform() hook to work during build
		async buildStart() {
			if (config.command !== 'build') return;

			const tempServer = await vite.createServer({
				mode: config.mode,
				root: config.root,
				logLevel: 'silent',
				server: {
					middlewareMode: true,
					hmr: false,
				},
				appType: 'custom',
				optimizeDeps: {
					noDiscovery: true,
					include: [],
				},
				configFile: false,
				plugins: [],
			});

			actionsRegistry = await createActionsRegistry({ viteServer: tempServer, debug, log });
			await tempServer.close();
		},

		async closeBundle() {
			if (config.command !== 'build') return;

			if (debug) {
				log('Building standalone server...');
			}

			const serverEntryCode = await generateServerEntryCode(config, options.logger);
			const tempEntryPath = path.join(config.root, '.cq-server-entry.mjs');
			await fs.writeFile(tempEntryPath, serverEntryCode);

			try {
				await vite.build({
					configFile: false,
					root: config.root,
					mode: 'production',
					build: {
						ssr: tempEntryPath,
						outDir: path.join(config.build.outDir, '..'),
						emptyOutDir: false,
						minify: true,
						rollupOptions: {
							external: id => !id.startsWith('.') && !path.isAbsolute(id),
							output: {
								format: 'es',
								entryFileNames: 'server.mjs',
							},
						},
					},
					logLevel: 'info',
				});

				if (debug) {
					log('Server bundled successfully!');
				}
			} finally {
				await fs.unlink(tempEntryPath).catch(() => {});
			}
		},

		resolveId(id, _importer, options) {
			if (options?.ssr) {
				return;
			}
			if (serverPattern.test(id)) {
				return { id, external: true };
			}
		},

		async handleHotUpdate(ctx) {
			if (!serverPattern.test(ctx.file)) {
				return;
			}

			if (debug) {
				log(`HMR: Updating ${ctx.file}`);
			}

			await updateActionInRegistry({ file: ctx.file, viteServer, actionsRegistry, debug, log });

			const moduleNode = viteServer.moduleGraph.getModuleById(ctx.file);
			return moduleNode ? [moduleNode] : [];
		},

		async transform(_code, id, options) {
			if (!serverPattern.test(id) || options?.ssr) {
				return;
			}

			const normalizedId = normalizePath(id);
			const relativePath = path.relative(config.root, normalizedId);
			const baseName = getBaseName(relativePath);

			const actions = actionsRegistry.get(baseName);
			if (!actions) return;

			const exports: [string, string, string][] = [];
			actions.forEach((action, name) => {
				const actionKey = `${baseName}/${name}`;
				exports.push([name, action[ACTION_META_KEY].type, actionKey]);
			});

			return generateClientStub({
				exports,
			});
		},
	};
}

export default cq;

function getBaseName(filePath: string): string {
	return filePath
		.replace(/^src\//, '')
		.replace(/\.(js|ts|mjs|mts)$/, '')
		.replace(/\.server$/, '');
}

async function getServerFiles(root: string): Promise<string[]> {
	return await glob('src/**/*.server.{js,ts,mjs,mts}', {
		cwd: root,
		absolute: true,
		ignore: ['**/node_modules/**'],
	});
}

async function createActionsRegistry(options: { viteServer: ViteDevServer; debug?: boolean; log: (msg: string) => void }): Promise<ActionsRegistry> {
	const { viteServer, debug = false, log } = options;

	const actionsRegistry: ActionsRegistry = new Map();
	const root = viteServer.config.root;
	const files = await getServerFiles(root);

	if (debug) {
		log(`Found ${files.length} server files`);
	}

	for (const file of files) {
		try {
			const module = await viteServer.ssrLoadModule(file);
			const relativePath = path.relative(root, file);
			const baseName = getBaseName(relativePath);

			const actionsMap = new Map<string, Action>();
			actionsRegistry.set(baseName, actionsMap);

			for (const [name, value] of Object.entries(module) as [string, Action][]) {
				if (typeof value === 'function' && ACTION_META_KEY in value) {
					actionsMap.set(name, value);

					if (debug) {
						const actionKey = `${baseName}/${name}`;
						log(`Registered ${value[ACTION_META_KEY].type}: ${actionKey}`);
					}
				}
			}

			if (actionsMap.size === 0) {
				actionsRegistry.delete(baseName);
			}
		} catch (err) {
			log(`${picocolors.red('Error')} loading module: ${file}`);
		}
	}

	return actionsRegistry;
}

function generateClientStub(options: { exports: [string, string, string][] }): string {
	const { exports } = options;
	return `import { __cq_invoke_action } from '@lachero/cq/internals/client';
${exports.map(([name, type, actionKey]) => `export const ${name} = __cq_invoke_action('${type}', '${actionKey}');`).join('\n')}
`;
}

function normalizePath(filePath: string): string {
	return filePath.replace(/\\/g, '/');
}

async function generateServerEntryCode(config: ResolvedConfig, loggerOptions?: LoggerOptions): Promise<string> {
	const root = config.root;
	const port = config.server.port || 5173;

	const files = await getServerFiles(root);

	const actionsImports: { baseName: string; varName: string; import: string }[] = [];
	for (const file of files) {
		const relativePath = path.relative(root, file);
		const baseName = getBaseName(relativePath);
		const varName = '__cq_' + baseName.replace(/\W+/g, '_');
		actionsImports.push({ baseName, varName, import: `import * as ${varName} from './${relativePath}';` });
	}

	const productionLoggerOptions = loggerOptions || { format: 'json' };
	const loggerOptionsStr = JSON.stringify(productionLoggerOptions);

	return `// Generated server entry by @lachero/cq
import { createH3App, makeServeStaticHandler, serve } from '@lachero/cq/internals/server';
${actionsImports.map(i => i.import).join('\n')}

const actionsRegistry = new Map([${actionsImports.map(({ baseName, varName }) => `['${baseName}', new Map(Object.entries(${varName}))]`).join(',')}]);

const app = createH3App(actionsRegistry, ${loggerOptionsStr});
app.use('/**', makeServeStaticHandler(import.meta.dirname));
serve(app, { port: ${port} });
`;
}

async function updateActionInRegistry(options: { file: string; viteServer: ViteDevServer; actionsRegistry: ActionsRegistry; debug: boolean; log: (msg: string) => void }) {
	const { file, viteServer, actionsRegistry, debug, log } = options;
	try {
		const moduleNode = viteServer.moduleGraph.getModuleById(file);
		if (moduleNode) {
			viteServer.moduleGraph.invalidateModule(moduleNode);
		}

		const module = await viteServer.ssrLoadModule(file);
		const relativePath = path.relative(viteServer.config.root, file);
		const baseName = getBaseName(relativePath);

		let actionsMap = actionsRegistry.get(baseName);
		if (!actionsMap) {
			actionsMap = new Map<string, Action>();
			actionsRegistry.set(baseName, actionsMap);
		} else {
			actionsMap.clear();
		}

		let actionCount = 0;
		for (const [name, value] of Object.entries(module) as [string, Action][]) {
			if (typeof value === 'function' && ACTION_META_KEY in value) {
				actionsMap.set(name, value);
				actionCount++;

				if (debug) {
					const actionKey = `${baseName}/${name}`;
					log(`HMR: Updated ${value[ACTION_META_KEY].type}: ${actionKey}`);
				}
			}
		}

		if (debug) {
			log(`HMR: Refreshed ${baseName} with ${actionCount} action(s)`);
		}
	} catch (err) {
		log(`HMR: ${picocolors.red('Error')} updating module: ${file}`);
	}
}
