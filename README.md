# CQ - Type-Safe CQRS for Modern Frontend

> A lightweight, type-safe CQRS (Command Query Responsibility Segregation) library with seamless Vite integration for building full-stack applications. Built on top of the blazing-fast [H3](https://github.com/h3js/h3) server.

[![npm version](https://img.shields.io/npm/v/@lachero/cq.svg)](https://www.npmjs.com/package/@lachero/cq)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why CQ?

**CQ fills the missing gap in modern frontend development** where you want to build a small JavaScript application but also need a lightweight server with full customizability. Instead of reaching for heavy frameworks or complex setups, CQ provides the perfect balance with its Vite plugin integration.

CQ leverages the CQRS pattern to separate read (queries) and write (commands) operations, making your application more maintainable and scalable while providing seamless type-safety across your entire stack.

## Features

- 🔒 **Full type-safety** between frontend and backend
- ⚡ **Vite integration** with HMR support for server code
- 🎯 **CQRS pattern** for clean separation of concerns
- 📝 **Schema validation** using Standard Schema
- 🚀 **Zero configuration** to get started
- 🔧 **Highly customizable** for complex use cases
- 📦 **Lightweight** with minimal dependencies
- 🏃 **Built on H3** - leveraging the fastest Node.js server framework

## Installation

```bash
npm i @lachero/cq
# or
pnpm add @lachero/cq
# or
yarn add @lachero/cq
# or
npm i https://github.com/lacherogwu/cq
```

## Quick Start

> **💡 Check out the [`examples/`](./examples) folder for working examples!**

CQ offers two main approaches:

### 🔥 Vite Integration (File-based auto-discovery)

Perfect for full-stack apps. Auto-discovers `.server.ts` files and generates type-safe clients:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { cq } from '@lachero/cq/vite';

export default defineConfig({
	plugins: [cq()],
});

// counter.server.ts
import { query, command } from '@lachero/cq';
import { z } from 'zod';

let count = 0;

export const getCounter = query(async () => ({ count }));

export const setCounter = command(z.object({ value: z.number() }), async ({ value }) => {
	count = value;
	return { count };
});

// counter.ts - Frontend usage
import { getCounter, setCounter } from './counter.server';

const { count } = await getCounter(); // Fully typed!
await setCounter({ value: 42 });
```

### ⚡ Fastify Integration (Separate Server)

For existing backends or when you need more control:

```typescript
// actions.ts
import { query, command } from '@lachero/cq';
import { z } from 'zod';

export const actions = {
	healthcheck: query(() => 'OK'),
	users: {
		createUser: command(z.object({ name: z.string() }), async ({ name }) => ({ id: crypto.randomUUID(), name })),
		getUserById: query(z.object({ id: z.string() }), async ({ id }) => ({ id, name: 'John Doe' })),
	},
};

export type Actions = typeof actions;

// server.ts
import Fastify from 'fastify';
import { cqFastify } from '@lachero/cq/fastify';
import { actions } from './actions';

const fastify = Fastify({ logger: true });

// Register CQ with your actions
fastify.register(cqFastify, { actions });

fastify.listen({ port: 3000 });

// client.ts
import { createActionsClient } from '@lachero/cq/client';
import type { Actions } from './actions';

const api = createActionsClient<Actions>({ url: 'http://localhost:3000' });

// Fully typed calls
const health = await api.healthcheck.query();
const user = await api.users.getUserById.query({ id: '123' });
const newUser = await api.users.createUser.command({ name: 'Jane' });
```

## Advanced Usage

### Error Handling

```typescript
import { query, HTTPError } from '@lachero/cq';

export const getUser = query(z.object({ id: z.string() }), async ({ id }) => {
	const user = await database.user.findById(id);
	if (!user) throw new HTTPError('User not found', { status: 404 });
	return user;
});
```

### Request Context & Authentication

```typescript
import { query, getEvent, getCookie } from '@lachero/cq';

export const getCurrentUser = query(async () => {
	const event = getEvent();
	const token = getCookie(event, 'auth-token') || event.headers.get('authorization');

	if (!token) throw new HTTPError('Unauthorized', { status: 401 });
	return await verifyAndGetUser(token);
});
```

### Database Integration

```typescript
import { query, command } from '@lachero/cq';
import { prisma } from './lib/prisma';

export const getUsers = query(async () => prisma.user.findMany());

export const createPost = command(z.object({ title: z.string(), content: z.string(), authorId: z.string() }), async input => prisma.post.create({ data: input, include: { author: true } }));
```

## Configuration

### Vite Plugin Options

```typescript
export default defineConfig({
	plugins: [
		cq({
			debug: true, // Enable debug logging
			logger: {
				level: 'info', // trace | debug | info | warn | error | fatal
				label: 'MY-API', // Custom label (default: 'CQ')
				format: 'pretty', // 'pretty' (dev) | 'json' (prod)
			},
		}),
	],
});
```

### Client Options

```typescript
const api = createActionsClient<ActionsType>({
	url: 'http://localhost:3000',
	headers: { Authorization: 'Bearer token' }, // or async function
	onRequest: ({ type, action, input }) => console.log('→', action),
	onResponse: ({ type, action, result }) => console.log('✓', action),
	onError: ({ type, action, result }) => console.error('✗', action, result),
});
```

## How It Works

CQ separates **Core** (action definition + HTTP routing) from **Integrations** (action organization):

### Core

- `query()` / `command()` - Define type-safe actions with validation
- `createH3App()` - HTTP server that routes requests to actions
- `createActionsClient()` - Type-safe client for consuming actions

### Integrations

- **Vite**: Auto-discovers `.server.ts` files, generates clients
- **Others**: Manual action organization, use `createActionsClient()`

```typescript
// 1. Define actions
export const getUser = query(schema, async (input) => { ... });

// 2a. Vite: Auto-discovered and routed
import { getUser } from './users.server';

// 2b. Other: Manual registry + client
const api = createActionsClient<ActionsType>({ url: '...' });
await api.users.getUser.query({ id: '123' });
```

**Benefits**: Framework agnostic core, flexible integrations, end-to-end type safety, consistent H3-powered HTTP layer.

```typescript
// users.server.ts - Auto-discovered by Vite integration
export const getUserById = query(z.number(), (userId) => { ... });
export const createUser = command(userSchema, (userData) => { ... });

// Frontend - Auto-generated client
import { getUserById, createUser } from './users.server';
const user = await getUserById(123); // Fully typed!
```

## TypeScript Support

CQ is built with TypeScript from the ground up. All server actions are fully typed, and the generated client functions maintain the same type signatures, ensuring end-to-end type safety.

## Roadmap

- **OpenAPI export** - Generate OpenAPI specs from your CQ actions

We're open to suggestions! [Open an issue](https://github.com/lacherogwu/qc/issues) to share your ideas.

## Credits

CQ is inspired by and builds upon the excellent work of:

- **[H3](https://github.com/h3js/h3)** - The minimal and fast server framework that powers CQ's backend
- **[SvelteKit's remote functions](https://svelte.dev/docs/kit/remote-functions)** - Pioneered the concept of seamless client-server function calls with type safety

## License

MIT © [LacheRo](https://github.com/lacherogwu)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
