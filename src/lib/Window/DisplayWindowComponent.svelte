<script lang="ts">
	import { KeyAction } from '$lib/Keybind/KeyActionEnum';
	import { KeybindService } from '$lib/Keybind/KeybindService';
	import { onDestroy, onMount } from 'svelte';
	import { fade, scale, slide } from 'svelte/transition';
	import WindowButton from './Button/WindowButtonComponent.svelte';
	import type { DisplayWindow } from './DisplayWindow';

	let {
		dWindow,
		onclose,
		onminimize,
		onmaximize,
		onfocus,
		onblur,
		onmovestart,
		onresizestart
	}: {
		dWindow: DisplayWindow;
		onclose: (e: Event) => boolean | void;
		onminimize: (e: Event) => boolean | void;
		onmaximize: (e: Event) => boolean | void;
		onfocus: (e: FocusEvent) => void;
		onblur: (e: FocusEvent) => void;
		onmovestart: (e: MouseEvent) => void;
		onresizestart: (e: MouseEvent) => void;
	} = $props();
	if (!dWindow) throw new Error('Failed to render DisplayWindow - no valid prop passed');
	console.debug('Mounted window:', dWindow);

	let dWindowElement: HTMLDivElement;
	let editMode = $derived(dWindow.editMode);
	let pendingMove = false;

	function cancelPendingMove() {
		pendingMove = false;
		document.removeEventListener('mousemove', handlePendingMove);
		document.removeEventListener('mouseup', cancelPendingMove);
	}

	function handlePendingMove(e: MouseEvent) {
		if (!pendingMove) return;

		cancelPendingMove();
		onmovestart(e);
	}

	function beginPendingMove(e: MouseEvent) {
		if (e.button != 0) return;

		pendingMove = true;
		document.addEventListener('mousemove', handlePendingMove);
		document.addEventListener('mouseup', cancelPendingMove);
	}

	const handleKeyUp = (e: KeyboardEvent) => {
		const keyAction = KeybindService.getEventKeyAction(e);
		switch (keyAction) {
			case KeyAction.WINDOW_CLOSE:
				return onclose(e);
			case KeyAction.WINDOW_MINIMIZE:
				return onminimize(e);
			case KeyAction.WINDOW_MAXIMIZE:
				return onmaximize(e);
			case KeyAction.WINDOW_RESIZE_MOD:
				return dWindow.setEditMode(null);
		}
	};
	const handleKeyDown = (e: KeyboardEvent) => {
		const keyAction = KeybindService.getEventKeyAction(e);
		switch (keyAction) {
			case KeyAction.WINDOW_RESIZE_MOD:
				return dWindow.setEditMode('resizing');
		}
	};

	onMount(() => {
		dWindowElement.addEventListener('keyup', handleKeyUp);
		dWindowElement.addEventListener('keydown', handleKeyDown);
	});
	onDestroy(() => {
		dWindowElement.removeEventListener('keyup', handleKeyUp);
		dWindowElement.removeEventListener('keydown', handleKeyDown);
		cancelPendingMove();
	});
</script>

<!-- TODO: finish z-index layer ordering shenanigans -->
<!-- TODO?: prevent window height going below button container height unless minimized -->
<!-- TODO: block tabindex from venturing outside of current window - especially if it's a window with a backdrop -->

{#if dWindow.backdropVisible}
	<div
		class="display-window-backdrop unselectable"
		data-window-class={dWindow.objectClass}
		style="--z-index: {dWindow.zIndex}"
		transition:fade|global={{ duration: 120 }}>
	</div>
{/if}
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	transition:scale={{ duration: 150 }}
	bind:this={dWindowElement}
	class="display-window-container unselectable"
	data-window-class={dWindow.objectClass}
	data-edit-mode={editMode}
	data-window-state={dWindow.windowState}
	draggable="false"
	style={dWindow.windowContainerCss}
	tabindex="0"
	{onfocus}
	{onblur}
	onmousedown={(e) => {
		onfocus(e);
		onresizestart(e);
	}}
	role="dialog">
	{#if dWindow.layout.fullTitleBar}
		<div class="display-window-titlebar" onmousedown={beginPendingMove} ondblclick={onmaximize} role="contentinfo">
			<span class="display-window-title">{dWindow.title}</span>
			{#if dWindow.layout.titleBarButtons}
				<span
					class="display-window-titlebar-btn-container"
					ondblclick={(e) => e.stopPropagation()}
					onmousedown={(e) => e.stopPropagation()}
					role="group">
					{#if dWindow.layout.minimizeButton}
						<button
							class="display-window-minimize-btn btn-icon"
							onclick={(e) => {
								e.stopPropagation();
								onminimize(e);
							}}
							title="Minimize"><icon class="minimize"></icon></button>
					{/if}
					{#if dWindow.layout.maximizeButton}
						<button
							class="display-window-maximize-btn btn-icon"
							onclick={(e) => {
								e.stopPropagation();
								onmaximize(e);
							}}
							title="Maximize"><icon class="maximize"></icon></button>
					{/if}
					{#if dWindow.layout.closeButton}
						<button
							class="display-window-close-btn btn-icon"
							onclick={(e) => {
								e.stopPropagation();
								onclose(e);
							}}
							title="Close"><icon class="add rot-45"></icon></button>
					{/if}
				</span>
			{/if}
		</div>
	{/if}

	<!-- {#if !dWindow.minimized} -->
	<div
		class="display-window-content-wrapper scrollbar-dark"
		style={dWindow.contentContainerCss}
		transition:slide|global={{ duration: 150 }}>
		<div class="display-window-content">
			{@render dWindow.content(dWindow.props)}
		</div>

		{#if dWindow.buttons?.length}
			<div class="display-window-button-container {dWindow.layout.buttonContainerClass}">
				{#each dWindow.buttons as button}
					<WindowButton {dWindow} {button} />
				{/each}
			</div>
		{/if}
	</div>
	<!-- {/if} -->
</div>
