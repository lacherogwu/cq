import { command, query } from '@lachero/cq';
import { z } from 'zod';

let counter = 0;

export const getCounter = query(() => {
	return counter;
});

export const setCounter = command(z.number(), count => {
	counter = count;
	return counter;
});
