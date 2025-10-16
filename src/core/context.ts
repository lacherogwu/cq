import { H3Event } from 'h3';
import { AsyncLocalStorage } from 'node:async_hooks';
import { ALS_KEY } from './constants';

if (!(ALS_KEY in globalThis)) {
	(globalThis as any)[ALS_KEY] = new AsyncLocalStorage<H3Event>();
}
const als = (globalThis as any)[ALS_KEY] as AsyncLocalStorage<H3Event>;

export function getEvent(): H3Event {
	const event = als.getStore();
	if (!event) {
		throw new Error('No event available. This function can only be called within an action handler.');
	}
	return event;
}

export function runInContext<T>(event: H3Event, fn: () => T | Promise<T>): Promise<T> {
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
