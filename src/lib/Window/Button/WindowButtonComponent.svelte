<script lang="ts">
	import type { DisplayWindow } from '../DisplayWindow.svelte';
	import type { WindowButton } from './WindowButton.svelte';

	let { button, dWindow }: { button: WindowButton; dWindow: DisplayWindow<any> } = $props();
	let cssIconClass = $derived(!button.text && button.icon ? 'btn-icon' : 'btn-text');
</script>

<button
	class="window-button {cssIconClass}"
	data-button-class={button.buttonClass}
	style={button.customStyle}
	onclick={(e) => button.action?.(e, dWindow)}>
	{#if button.icon}
		<icon class={button.icon}></icon>
	{/if}
	{button.text}
</button>
