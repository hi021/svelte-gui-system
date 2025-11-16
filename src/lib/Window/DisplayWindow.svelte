<script lang="ts">
	import type { DisplayWindow, WindowEditMode } from "./DisplayWindow";
	import { KeybindService } from "$lib/Keybind/KeybindService";
	import { fade, scale, slide } from "svelte/transition";
	import { onDestroy, onMount } from "svelte";
	import { KeyAction } from "$lib/Keybind/KeyActionEnum";
	import WindowButton from "./Button/WindowButton.svelte";

	let {
		dWindow,
		onclose,
		onminimize,
		onmaximize,
		onfocus,
		onmovestart,
		onresizestart
	}: {
		dWindow: DisplayWindow;
		onclose: (e: Event) => boolean | void;
		onminimize: (e: Event) => boolean | void;
		onmaximize: (e: Event) => boolean | void;
		onfocus: (e: FocusEvent) => void;
		onmovestart: (e: MouseEvent) => void;
		onresizestart: (e: MouseEvent) => void;
	} = $props();
	if (!dWindow) throw new Error("Failed to render DisplayWindow - no valid prop passed");
	console.debug("Mounted window:", dWindow);

	let dWindowElement: HTMLDivElement;
	let editMode: WindowEditMode = $state(null);

	const setEditMode = (mode: WindowEditMode = null) => {
		dWindow.setEditMode(mode);
		editMode = dWindow.editMode;
	};
	// TODO this allows the div to be focused (:focus) - to determine
	// const preventFocus = (e: DragEvent) => e.preventDefault();
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
				return setEditMode();
		}
	};
	const handleKeyDown = (e: KeyboardEvent) => {
		const keyAction = KeybindService.getEventKeyAction(e);
		switch (keyAction) {
			case KeyAction.WINDOW_RESIZE_MOD:
				return setEditMode("resizing");
		}
	};

	onMount(() => {
		// dWindowElement.addEventListener("dragstart", preventFocus);
		dWindowElement.addEventListener("keyup", handleKeyUp);
		dWindowElement.addEventListener("keydown", handleKeyDown);
	});
	onDestroy(() => {
		// dWindowElement.removeEventListener("dragstart", preventFocus);
		dWindowElement.removeEventListener("keyup", handleKeyUp);
		dWindowElement.removeEventListener("keydown", handleKeyDown);
	});
</script>

{#if dWindow.backdropVisible}
	<div
		class="display-window-backdrop unselectable"
		data-window-class={dWindow.windowClass}
		style="--z-index: {dWindow.zIndex}"
		transition:fade|global={{ duration: 120 }}>
	</div>
{/if}
<div
	transition:scale={{ duration: 150 }}
	bind:this={dWindowElement}
	class="display-window-container unselectable"
	data-window-class={dWindow.windowClass}
	data-edit-mode={editMode}
	draggable="false"
	style={dWindow.css}
	tabindex="0"
	onmousedown={(e) => {
		onfocus(e);
		onresizestart(e);
	}}
	role="dialog">
	<!-- {onfocus} -->
	{#if dWindow.layout.shouldRenderTitleBar()}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="display-window-titlebar"
			onmousedown={(e) => {
				const tagName = (e.target as HTMLElement)?.tagName;
				if (tagName == "BUTTON" || tagName == "ICON") return;
				setEditMode("moving");
				onmovestart(e);
			}}
			role="contentinfo">
			<span class="display-window-title">{dWindow.title}</span>
			{#if dWindow.layout.shouldRenderTitleBarButtonContainer()}
				<span class="display-window-titlebar-btn-container">
					{#if dWindow.layout.minimizeButton}
						<button class="display-window-minimize-btn btn-icon" onclick={onminimize} title="Minimize"
							><icon class="minimize"></icon></button>
					{/if}
					{#if dWindow.layout.maximizeButton}
						<button class="display-window-maximize-btn btn-icon" onclick={onmaximize} title="Maximize"
							><icon class="maximize"></icon></button>
					{/if}
					{#if dWindow.layout.closeButton}
						<button class="display-window-close-btn btn-icon" onclick={onclose} title="Close"
							><icon class="add rot-45"></icon></button>
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
				<!-- TODO implement ButtonLayout -->
				<div class="display-window-button-container {dWindow.layout.getButtonContainerClass()}">
					{#each dWindow.buttons as button}
						<WindowButton {dWindow} {button} />
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
