<script lang="ts">
	import type { Audio } from './Audio.svelte';
	import { MediaState } from './MediaState';

	let {
		audio,
		onplay,
		onpause,
		onended
	}: {
		audio: Audio;
		onplay: (e: Event, audio: Audio) => boolean | void;
		onpause: (e: Event, audio: Audio) => boolean | void;
		onended: (e: Event, audio: Audio) => boolean | void;
	} = $props();

	// @ts-expect-error allow svelte components to modify state
	if (!audio.lazy) audio._state = MediaState.READY;
	const audioTypeWorkaround = audio as any;
</script>

{#if audio.state != MediaState.UNDEFINED}
	<audio
		data-audio-class={audio.objectClass}
		data-audio-tag={audio.tag}
		bind:volume={audio.volume}
		bind:this={audioTypeWorkaround._element}
		bind:playbackRate={audio.speed}
		src={audio.path}
		onplay={(e) => onplay(e, audio)}
		onended={(e) => onended(e, audio)}
		onpause={(e) => onpause(e, audio)}>
	</audio>
{/if}
