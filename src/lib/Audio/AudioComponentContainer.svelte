<script lang="ts">
	import type { Audio as AudioObject } from './Audio.svelte';
	import AudioComponent from './AudioComponent.svelte';
	import { setAudioState } from './AudioInternal';
	import { AudioService } from './AudioService';
	import { MediaState } from './MediaState';

	const { audioManager }: { audioManager: AudioService } = $props();
	const audioObjects = $derived(audioManager.audioObjects);

	function onended(_: Event, audio: AudioObject) {
		setAudioState(audio, MediaState.ENDED);
	}
	function onpause(_: Event, audio: AudioObject) {
		setAudioState(audio, MediaState.PAUSED);
	}
	function onplay(_: Event, audio: AudioObject) {
		setAudioState(audio, MediaState.PLAYING);
	}
</script>

{#each $audioObjects as audioObject (audioObject.id)}
	<AudioComponent audio={audioObject} {onplay} {onpause} {onended} />
{/each}
