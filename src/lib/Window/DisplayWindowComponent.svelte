<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import Icon from '../Icon/Icon.svelte';
	import { KeyAction } from '../Keybind/KeyActionEnum';
	import { KeybindService } from '../Keybind/KeybindService';
	import Util from '../Util/Util';
	import WindowButton from './Button/WindowButtonComponent.svelte';
	import type { DisplayWindow } from './DisplayWindow.svelte';
	import { setWindowElement } from './DisplayWindowInternal';

	let {
		dWindow,
		isFocused,
		onclose,
		onminimize,
		onmaximize,
		onfocus,
		onblur,
		onmovestart,
		onresizestart
	}: {
		dWindow: DisplayWindow<any>;
		isFocused: (dWindow: DisplayWindow<any>) => boolean;
		onclose: () => void;
		onminimize: (e: Event) => void;
		onmaximize: (e: Event) => void;
		onfocus: (e: FocusEvent) => void;
		onblur: (e: FocusEvent) => void;
		onmovestart: (e: MouseEvent) => void;
		onresizestart: (e: MouseEvent) => void;
	} = $props();
	let editMode = $derived(dWindow.editMode);
	let windowElement: HTMLDivElement | undefined;
	let pendingMove = false;

	function cancelPendingMove() {
		pendingMove = false;
		if (typeof document === 'undefined') return;

		document.removeEventListener('mousemove', handlePendingMove);
		document.removeEventListener('mouseup', cancelPendingMove);
	}

	function handlePendingMove(e: MouseEvent) {
		if (!pendingMove) return;

		cancelPendingMove();
		onmovestart(e);
	}

	function beginPendingMove(e: MouseEvent) {
		if (e.button !== 0) return;

		pendingMove = true;
		document.addEventListener('mousemove', handlePendingMove);
		document.addEventListener('mouseup', cancelPendingMove);
	}

	const handleKeyUp = (e: KeyboardEvent) => {
		const keyAction = KeybindService.getEventKeyAction(e);
		switch (keyAction) {
			case KeyAction.WINDOW_CLOSE:
				return onclose();
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

	const handleMousedown = (e: MouseEvent) => {
		onfocus(e);
		onresizestart(e);
	};
	const handleBlur = (e: FocusEvent) => {
		if (e.relatedTarget instanceof Node && windowElement?.contains(e.relatedTarget)) return;
		onblur(e);
	};

	onMount(() => {
		setWindowElement(dWindow, windowElement);
		if (!dWindow.element)
			return console.error(`Window initialization error - No DOM element bound`, dWindow.toString());

		if (!dWindow.hasExplicitSize) dWindow.scaleToContent();
		dWindow.element.addEventListener('keyup', handleKeyUp);
		dWindow.element.addEventListener('keydown', handleKeyDown);
		dWindow.element.addEventListener('mousedown', handleMousedown);
		return () => {
			dWindow.element!.removeEventListener('keyup', handleKeyUp);
			dWindow.element!.removeEventListener('keydown', handleKeyDown);
			dWindow.element!.removeEventListener('mousedown', handleMousedown);
			cancelPendingMove();
			setWindowElement(dWindow, undefined);
		};
	});
</script>

<!-- TODO?: prevent window height going below button container height unless minimized -->

{#if dWindow.backdropVisible}
	<div
		class="display-window-backdrop unselectable"
		data-window-class={dWindow.objectClass}
		data-window-tag={dWindow.tag}
		data-window-state={dWindow.windowState}
		style="--z-index: {dWindow.zIndex}"
		transition:fade|global={{ duration: 120 * dWindow.transitionDurationMultiplier }}>
	</div>
{/if}
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	transition:scale={{ duration: 150 * dWindow.transitionDurationMultiplier }}
	bind:this={windowElement}
	use:Util.trapFocus
	class="display-window-container unselectable"
	data-window-class={dWindow.objectClass}
	data-window-tag={dWindow.tag}
	data-window-state={dWindow.windowState}
	data-window-focused={isFocused(dWindow) ? '' : undefined}
	data-edit-mode={editMode}
	draggable="false"
	style={dWindow.windowContainerCss}
	tabindex="0"
	{onfocus}
	onblur={handleBlur}
	role="dialog">
	{#if dWindow.layout.fullTitleBar}
		<div class="display-window-titlebar" onmousedown={beginPendingMove} ondblclick={onmaximize} role="contentinfo">
			<!-- TODO: add titlebar icon -->
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
							title="Minimize"><Icon tag="window-minimize" /></button>
					{/if}
					{#if dWindow.layout.maximizeButton}
						<button
							class="display-window-maximize-btn btn-icon"
							onclick={(e) => {
								e.stopPropagation();
								onmaximize(e);
							}}
							title="Maximize"><Icon tag="window-maximize" /></button>
					{/if}
					{#if dWindow.layout.closeButton}
						<button
							class="display-window-close-btn btn-icon"
							onclick={(e) => {
								e.stopPropagation();
								onclose();
							}}
							title="Close"><Icon tag="window-close" /></button>
					{/if}
				</span>
			{/if}
		</div>
	{/if}

	<div
		class="display-window-content-wrapper scrollbar-dark"
		style={dWindow.contentContainerCss}
		transition:dWindow.contentWrapperTransition|global={{
			duration: 150 * dWindow.transitionDurationMultiplier
		}}>
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
</div>
