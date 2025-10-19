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

Choose your integration:

<details>
<summary><strong>🔥 Vite Integration</strong> (File-based auto-discovery)</summary>

### 1. Configure Vite Plugin

```typescript
import { defineConfig } from 'vite';
import { cq } from '@lachero/cq/vite';

export default defineConfig({
	plugins: [cq()],
});
```

### 2. Create Server Actions

Create files ending with `.server.ts`:

```typescript
// src/users.server.ts
import { command, query } from '@lachero/cq';
import { z } from 'zod';

export const getUser = query(z.object({ id: z.string() }), async ({ id }) => ({ id, name: 'John', email: 'john@example.com' }));

export const createUser = command(z.object({ name: z.string(), email: z.string().email() }), async input => ({ id: crypto.randomUUID(), ...input }));
```

### 3. Use in Frontend

```typescript
import { getUser, createUser } from './users.server';

// Fully typed calls
const user = await getUser({ id: '123' });
const newUser = await createUser({ name: 'Jane', email: 'jane@example.com' });
```

</details>

<details>
<summary><strong>⚡ Fastify Integration</strong> (Coming soon)</summary>

### 1. Organize Your Actions

```typescript
// actions/users.ts
import { query, command } from '@lachero/cq';
import { z } from 'zod';

export const getUser = query(z.object({ id: z.string() }), async ({ id }) => ({ id, name: 'John', email: 'john@example.com' }));

export const createUser = command(z.object({ name: z.string(), email: z.string().email() }), async input => ({ id: crypto.randomUUID(), ...input }));
```

### 2. Create Server

```typescript
// server.ts
import { createH3App } from '@lachero/cq/internals/server';
import * as users from './actions/users';

export const actions = { users };
export type ActionsType = typeof actions;

// Convert to registry and create server
const actionsRegistry = new Map([['users', new Map(Object.entries(users))]]);

const h3App = createH3App(actionsRegistry);
// Mount h3App in your Fastify server
```

### 3. Create Type-Safe Client

```typescript
// client.ts
import { createActionsClient } from '@lachero/cq/client';
import type { ActionsType } from './server';

const api = createActionsClient<ActionsType>({
	url: 'http://localhost:3000',
});

// Fully typed calls
const user = await api.users.getUser.query({ id: '123' });
const newUser = await api.users.createUser.command({ name: 'Jane', email: 'jane@example.com' });
```

</details>

## Advanced Usage

<details>
<summary><strong>Error Handling</strong></summary>

```typescript
import { query, HTTPError } from '@lachero/cq';

export const getUser = query(z.object({ id: z.string() }), async ({ id }) => {
	const user = await database.user.findById(id);
	if (!user) throw new HTTPError('User not found', { status: 404 });
	return user;
});
```

</details>

<details>
<summary><strong>Request Context & Authentication</strong></summary>

```typescript
import { query, getEvent, getCookie } from '@lachero/cq';

export const getCurrentUser = query(async () => {
	const event = getEvent();
	const token = getCookie(event, 'auth-token') || event.headers.get('authorization');

	if (!token) throw new HTTPError('Unauthorized', { status: 401 });
	return await verifyAndGetUser(token);
});
```

</details>

<details>
<summary><strong>Database Integration</strong></summary>

```typescript
import { query, command } from '@lachero/cq';
import { prisma } from './lib/prisma';

export const getUsers = query(async () => prisma.user.findMany());

export const createPost = command(z.object({ title: z.string(), content: z.string(), authorId: z.string() }), async input => prisma.post.create({ data: input, include: { author: true } }));
```

</details>

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

- **Fastify integration** - Native integration with Fastify server
- **Hono integration** - Seamless integration with Hono for edge computing
- **Dynamic client generation** - Standalone client generation for projects not using Vite
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
