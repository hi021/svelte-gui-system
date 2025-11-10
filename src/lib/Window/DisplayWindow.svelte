<script lang="ts">
	import type { DisplayWindow } from "./DisplayWindow";
	import { KeybindService } from "$lib/KeybindService";
	import { scale, slide } from "svelte/transition";
	import { onDestroy, onMount } from "svelte";

	let {
		dWindow,
		onclose,
		onminimize,
		onmaximize,
		onfocus,
		ondragstart
	}: {
		dWindow: DisplayWindow;
		onclose: (e: Event) => boolean | void;
		onminimize: (e: Event) => boolean | void;
		onmaximize: (e: Event) => boolean | void;
		onfocus: (e: FocusEvent) => void;
		ondragstart: (e: MouseEvent) => void;
	} = $props();
	if (!dWindow) throw new Error("Failed to render DisplayWindow - no valid prop passed");

	console.debug("Mounted window:", dWindow);
	let dWindowElement: HTMLDivElement;

	const preventFocus = (e: DragEvent) => e.preventDefault();
	const handleKeyUp = (e: KeyboardEvent) => {
		if (e.key == KeybindService.KEYMAP.WINDOW_CLOSE) {
			return onclose(e);
		}
	};

	onMount(() => {
		dWindowElement.addEventListener("dragstart", preventFocus);
		dWindowElement.addEventListener("keyup", handleKeyUp);
	});
	onDestroy(() => {
		dWindowElement.removeEventListener("dragstart", preventFocus);
		dWindowElement.removeEventListener("keyup", handleKeyUp);
	});
</script>

<div
	class="display-window-container unselectable"
	transition:scale={{ duration: 150 }}
	bind:this={dWindowElement}
	data-window-class={dWindow.windowClass}
	draggable="false"
	style={dWindow.css}
	tabindex="0"
	onmousedown={onfocus}
	{onfocus}
	role="dialog">
	{#if dWindow.layout.shouldRenderTitleBar()}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="display-window-titlebar" onmousedown={ondragstart} role="contentinfo">
			<span class="display-window-title">{dWindow.title}</span>
			{#if dWindow.layout.shouldRenderTitleBarButtonContainer()}
				<span class="display-window-titlebar-btn-container">
					{#if dWindow.layout.minimizeButton}
						<button class="display-window-minimize-btn" onclick={onminimize}>MN</button>
					{/if}
					{#if dWindow.layout.maximizeButton}
						<button class="display-window-maximize-btn" onclick={onmaximize}>MX</button>
					{/if}
					{#if dWindow.layout.closeButton}
						<button class="display-window-close-btn" onclick={onclose}>X</button>
					{/if}
				</span>
			{/if}
		</div>
	{/if}

	{#if !dWindow.minimized}
		<div class="display-window-content-wrapper" transition:slide={{ duration: 150 }}>
			<div class="display-window-content">
				{@render dWindow.content(dWindow.props)}
			</div>

			{#if dWindow.buttons?.length}
				<div class="display-window-button-container">
					{#each dWindow.buttons as button}
						<button onclick={button.action}>{button.text}</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
