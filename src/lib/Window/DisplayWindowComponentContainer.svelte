<script lang="ts">
	import { EventService } from '$lib/Event/EventService';
	import { WindowCloseEvent } from '$lib/Event/WindowCloseEvent';
	import { onMount } from 'svelte';
	import DisplayWindowComponent from './DisplayWindowComponent.svelte';
	import type { WindowService } from './WindowService';

	const { windowManager }: { windowManager: WindowService } = $props();

	const handleDrag = (e: MouseEvent) => windowManager.handleDrag(e);
	const handleDragEnd = (e: MouseEvent) => windowManager.handleDragEnd(e);

	const windows = $derived(windowManager.windows);
	onMount(() => {
		document.addEventListener('mousemove', handleDrag);
		document.addEventListener('mouseup', handleDragEnd);
		return () => {
			document.removeEventListener('mousemove', handleDrag);
			document.removeEventListener('mouseup', handleDragEnd);
		};
	});
</script>

{#each $windows as dWindow (dWindow.id)}
	<DisplayWindowComponent
		{dWindow}
		onclose={(e) => EventService.dispatchEvent(new WindowCloseEvent(dWindow))}
		onminimize={(e) => windowManager.handleMinimize(e, dWindow)}
		onmaximize={(e) => windowManager.handleMaximize(e, dWindow)}
		onfocus={(e) => windowManager.handleFocus(e, dWindow)}
		onblur={(e) => windowManager.handleBlur(e, dWindow)}
		onmovestart={(e: MouseEvent) => {
			dWindow.setEditMode('moving');
			if (dWindow.editMode !== 'moving') return;

			if (dWindow.maximized) {
				windowManager.toggleMaximizeWindow(dWindow);
				// TODO!: handle anchors! - snaps to bottom for bottom anchors, and won't work with center anchors either
				dWindow.setPosition(dWindow.anchor.x * (e.clientX - dWindow.size.x / 2), 0);
			}
			windowManager.handleDragStart(e, dWindow, dWindow.editMode);
		}}
		onresizestart={(e: MouseEvent) => {
			dWindow.editMode === 'resizing' && windowManager.handleDragStart(e, dWindow, dWindow.editMode);
		}} />
{/each}
