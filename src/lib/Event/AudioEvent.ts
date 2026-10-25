import type { Audio } from '../Audio/Audio.svelte';
import { ApplicationEvent } from './ApplicationEvent';

export abstract class AudioEvent extends ApplicationEvent {
	public override readonly className: string = 'AudioEvent';
	public readonly audioObject: Audio;

	public constructor(audioObject: Audio) {
		super();
		this.audioObject = audioObject;
	}
}
