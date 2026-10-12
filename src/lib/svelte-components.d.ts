declare module '*.svelte' {
	import type { Component, Snippet } from 'svelte';

	const component: Component<Record<string, unknown>>;
	export default component;
	export const content: Snippet<[props?: { text: string }]>;
}

declare module '*.css';
