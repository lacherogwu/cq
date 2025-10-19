import * as serverCounter from './counter.server';

export async function setupCounter(element: HTMLButtonElement) {
	let counter = await serverCounter.getCounter();
	const setCounter = async (count: number) => {
		counter = await serverCounter.setCounter(count);
		element.innerHTML = `count is ${counter}`;
	};
	element.addEventListener('click', () => setCounter(counter + 1));
	setCounter(counter);
}
