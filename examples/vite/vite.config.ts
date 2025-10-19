import { defineConfig } from 'vite';
import { cq } from '@lachero/cq/vite';
// https://vite.dev/config/

export default defineConfig({
	plugins: [cq()],
});
