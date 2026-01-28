<script lang="ts">
	import type { Audio } from './Audio.svelte';
	import { MediaState } from './MediaState';

	let { audio }: { audio: Audio } = $props();
	if (!audio.lazy) audio.state = MediaState.READY;

	function onended() {
		audio.state = MediaState.ENDED;
	}
	function onpause() {
		audio.state = MediaState.PAUSED;
	}
	function onplay() {
		audio.state = MediaState.PLAYING;
	}
</script>

{#if audio.state != MediaState.UNDEFINED}
	<audio
		data-audio-class={audio.class}
		data-audio-tag={audio.tag}
		bind:volume={audio.volume}
		bind:this={audio.element}
		bind:playbackRate={audio.speed}
		src={audio.path}
		{onplay}
		{onended}
		{onpause}></audio>
{/if}
