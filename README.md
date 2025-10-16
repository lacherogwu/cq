# CQ - Type-Safe CQRS for Modern Frontend

> A lightweight, type-safe CQRS (Command Query Responsibility Segregation) library with seamless Vite integration for building full-stack applications. Built on top of the blazing-fast [H3](https://github.com/h3js/h3) server.

[![npm version](https://img.shields.io/npm/v/@lachero/cq.svg)](https://www.npmjs.com/package/@lachero/cq)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why CQ?

**CQ fills the missing gap in modern frontend development** where you want to build a small JavaScript application but also need a lightweight server with full customizability. Instead of reaching for heavy frameworks or complex setups, CQ provides the perfect balance with its Vite plugin integration.

**Perfect for any project size:**

- **Small projects**: Get up and running instantly with minimal configuration
- **Large projects**: Scale with confidence using full type-safety between frontend and backend
- **Rapid development**: Hot module reloading for both client and server code
- **Type-safe by default**: Catch errors at compile-time, not runtime

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
npm i https://github.com/lacherogwu/cq
# or
pnpm add @lachero/cq
# or
yarn add @lachero/cq
```

## Quick Start

### 1. Configure Vite

Add the CQ plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { cq } from '@lachero/cq/vite';

export default defineConfig({
	plugins: [
		cq({
			debug: true, // Optional: enable debug logging
		}),
	],
});
```

### 2. Create Server Actions

Create a file ending with `.server.ts` (e.g., `src/actions.server.ts`):

```typescript
import { command, query } from '@lachero/cq';
import { z } from 'zod'; // or any Standard Schema compatible library

// Define a query (read operation)
export const getUser = query(
	z.object({ id: z.string() }), // Input schema
	async input => {
		// Your server logic here
		return {
			id: input.id,
			name: 'John Doe',
			email: 'john@example.com',
		};
	},
);

// Define a command (write operation)
export const createUser = command(
	z.object({
		name: z.string(),
		email: z.string().email(),
	}),
	async input => {
		// Your server logic here
		const user = {
			id: Math.random().toString(36),
			...input,
			createdAt: new Date(),
		};

		// Save to database, send emails, etc.
		console.log('Creating user:', user);

		return user;
	},
);

// Query without input
export const getStats = query(async () => {
	return {
		totalUsers: 42,
		activeUsers: 28,
	};
});
```

### 3. Use in Frontend

Import and use your server actions in your frontend code:

```typescript
import { getUser, createUser, getStats } from './actions.server';

// Query with input
const user = await getUser({ id: '123' });
console.log(user.name); // Fully typed!

// Command with input
const newUser = await createUser({
	name: 'Jane Doe',
	email: 'jane@example.com',
});

// Query without input
const stats = await getStats();
console.log(stats.totalUsers); // Type-safe!
```

## Advanced Usage

### Error Handling

CQ provides built-in error handling with `HTTPError`:

```typescript
import { query, HTTPError } from '@lachero/cq';

export const getUser = query(z.object({ id: z.string() }), async input => {
	const user = await database.user.findById(input.id);

	if (!user) {
		throw new HTTPError('User not found', { status: 404 });
	}

	return user;
});
```

### Accessing Request Context

Access the underlying H3 event for request context:

```typescript
import { query, getEvent, getCookie } from '@lachero/cq';

export const getCurrentUser = query(async () => {
	const event = getEvent();
	const token = getCookie(event, 'auth-token') || event.req.headers.get('authorization');

	if (!token) {
		throw new HTTPError('Unauthorized', { status: 401 });
	}

	// Verify token and return user
	return await verifyAndGetUser(token);
});
```

### Database Integration

CQ works great with any database or ORM:

```typescript
import { query, command } from '@lachero/cq';
import { prisma } from './lib/prisma';

export const getUsers = query(async () => {
	return await prisma.user.findMany();
});

export const createPost = command(
	z.object({
		title: z.string(),
		content: z.string(),
		authorId: z.string(),
	}),
	async input => {
		return await prisma.post.create({
			data: input,
			include: {
				author: true,
			},
		});
	},
);
```

## Configuration

### Vite Plugin Options

```typescript
export interface CqViteOptions {
	/**
	 * Enable debug logging
	 * @default false
	 */
	debug?: boolean;
}
```

## How It Works

1. **File Detection**: CQ automatically discovers files ending with `.server.ts` or `.server.js`
2. **Action Registration**: Server actions (queries and commands) are registered and made available via HTTP endpoints
3. **Client Generation**: The Vite plugin generates type-safe client functions that match your server actions
4. **Runtime Execution**: Client calls are automatically routed to the corresponding server actions with full type safety

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
