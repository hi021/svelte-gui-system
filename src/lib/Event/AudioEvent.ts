import type { Audio } from '../Audio/Audio.svelte';
import { GameEvent } from './GameEvent';

export abstract class AudioEvent extends GameEvent {
	public audioObject: Audio;

	public constructor(audioObject: Audio) {
		super();
		this.audioObject = audioObject;
	}
}
