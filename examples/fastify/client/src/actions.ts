import { createActionsClient } from '@lachero/cq/client';
import type { Actions } from '../../server/src/actions';

export const actions = createActionsClient<Actions>({
	url: 'http://localhost:3000',
});
