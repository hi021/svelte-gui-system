<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Audio as AudioObject } from './Audio.svelte';
	import AudioComponent from './AudioComponent.svelte';
	import { AudioService } from './AudioService';
	import { MediaState } from './MediaState';

	let { audioManager }: { audioManager: AudioService } = $props();
	let audioObjects: AudioObject[] = [];
	const audioObjectsUnsubscriber = audioManager.audioObjects.subscribe((value) => (audioObjects = value));
	onDestroy(() => {
		audioObjectsUnsubscriber();
	});

	function onended(e: Event, audio: AudioObject) {
		audio.state = MediaState.ENDED;
	}
	function onpause(e: Event, audio: AudioObject) {
		audio.state = MediaState.PAUSED;
	}
	function onplay(e: Event, audio: AudioObject) {
		audio.state = MediaState.PLAYING;
	}
</script>

{#each audioObjects as audioObject}
	<AudioComponent audio={audioObject} {onplay} {onpause} {onended} />
{/each}
