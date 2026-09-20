<script lang="ts">
	import { EventService } from '$lib/Event/EventService';
	import { WindowCloseEvent } from '$lib/Event/WindowCloseEvent';
	import { Vec2 } from '$lib/Util/Vec2';
	import { onDestroy } from 'svelte';
	import { DisplayWindow } from './DisplayWindow';
	import DisplayWindowComponent from './DisplayWindowComponent.svelte';
	import type { WindowService } from './WindowService';

	const { windowManager }: { windowManager: WindowService } = $props();

	const handleDrag = (e: MouseEvent) => windowManager.handleDrag(e);
	const handleDragEnd = (e: MouseEvent) => windowManager.handleDragEnd(e);
	document.addEventListener('mousemove', handleDrag);
	document.addEventListener('mouseup', handleDragEnd);

	type WindowView = {
		dWindow: DisplayWindow;
	};

	let windowObjects: WindowView[] = $state([]);
	const windowsUnsubscriber = (() =>
		windowManager.windows.subscribe((value) => {
			windowObjects = value.map((dWindow) => ({
				dWindow
			}));
		}))();
	onDestroy(() => {
		windowsUnsubscriber();
		document.removeEventListener('mousemove', handleDrag);
		document.removeEventListener('mouseup', handleDragEnd);
	});
</script>

{#each windowObjects as dWindow}
	<DisplayWindowComponent
		dWindow={dWindow.dWindow}
		onclose={(e) => EventService.dispatchEvent(new WindowCloseEvent(dWindow.dWindow))}
		onminimize={(e) => windowManager.handleMinimize(e, dWindow.dWindow)}
		onmaximize={(e) => windowManager.handleMaximize(e, dWindow.dWindow)}
		onfocus={(e) => windowManager.handleFocus(e, dWindow.dWindow)}
		onblur={(e) => windowManager.handleBlur(e, dWindow.dWindow)}
		onmovestart={(e: MouseEvent) => {
			dWindow.dWindow.setEditMode('moving');
			if (dWindow.dWindow.editMode !== 'moving') return;

			if (dWindow.dWindow.maximized) {
				dWindow.dWindow.maximized = false;
				// TODO!: handle anchors! - snaps to bottom for bottom anchors, and won't work with center anchors either
				dWindow.dWindow.position = new Vec2(dWindow.dWindow.anchor.x * (e.clientX - dWindow.dWindow.size.x / 2), 0);
			}
			windowManager.handleDragStart(e, dWindow.dWindow, dWindow.dWindow.editMode);
		}}
		onresizestart={(e: MouseEvent) => {
			dWindow.dWindow.editMode === 'resizing' &&
				windowManager.handleDragStart(e, dWindow.dWindow, dWindow.dWindow.editMode);
		}} />
{/each}
