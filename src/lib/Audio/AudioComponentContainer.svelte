<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Audio as AudioObject } from './Audio.svelte';
	import AudioComponent from './AudioComponent.svelte';
	import { AudioService } from './AudioService';
	import { MediaState } from './MediaState';

	const { audioManager }: { audioManager: AudioService } = $props();
	// svelte-ignore non_reactive_update
	let audioObjects: AudioObject[] = [];
	const audioObjectsUnsubscriber = (() => audioManager.audioObjects.subscribe((value) => (audioObjects = value)))();
	onDestroy(() => {
		audioObjectsUnsubscriber();
	});

	function onended(_: Event, audio: AudioObject) {
		// @ts-expect-error allow svelte components to modify state
		audio._state = MediaState.ENDED;
	}
	function onpause(_: Event, audio: AudioObject) {
		// @ts-expect-error allow svelte components to modify state
		audio._state = MediaState.PAUSED;
	}
	function onplay(_: Event, audio: AudioObject) {
		// @ts-expect-error allow svelte components to modify state
		audio._state = MediaState.PLAYING;
	}
</script>

{#each audioObjects as audioObject (audioObject.id)}
	<AudioComponent audio={audioObject} {onplay} {onpause} {onended} />
{/each}
