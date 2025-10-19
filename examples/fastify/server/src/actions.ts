import { command, query, type Action, type ActionType } from '@lachero/cq';
import z from 'zod';

export const actions = {
	healthcheck: query(() => 'OK'),
	users: {
		createUser: command(
			z.object({
				name: z.string(),
			}),
			async input => {
				const { name } = input;
				return { id: 'user_123', name };
			},
		),
		getUserById: query(
			z.object({
				id: z.string(),
			}),
			async input => {
				const { id } = input;
				return { id, name: 'John Doe' };
			},
		),
		listAll: query(() => {
			return [
				{ id: 'user_123', name: 'John Doe' },
				{ id: 'user_456', name: 'Jane Smith' },
			];
		}),
		cool: {
			nested: query(() => 'This is a nested action'),
		},
	},
};

export type Actions = typeof actions;
