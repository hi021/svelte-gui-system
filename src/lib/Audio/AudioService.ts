import { writable } from 'svelte/store';
import { Audio } from './Audio.svelte';

export class AudioService {
	static readonly MAX_AUDIO_OBJECTS = 512;

	#audioObjectsByTag = new Map<string, Audio>();
	#audioObjects = new Map<number, Audio>();
	#audioObjectsStore = writable<Audio[]>([]);
	#playingAudioObjects = new Array<Audio>(); // TODO
	#audioIdSequence = 1;

	public get audioObjects() {
		return this.#audioObjectsStore;
	}

	public registerAudioObject(path: string, tag?: string, lazy = false) {
		if (this.#audioObjects.size >= AudioService.MAX_AUDIO_OBJECTS)
			throw new Error(
				`Failed to register audio object: maximum number of audio objects is ${AudioService.MAX_AUDIO_OBJECTS}`
			);

		// TODO validate path uniqueness (don't fail)
		// TODO validate tag uniqueness
		const audio = new Audio(this.#audioIdSequence, path, tag, lazy);
		this.#audioObjects.set(this.#audioIdSequence++, audio);
		if (tag != null) this.#audioObjectsByTag.set(tag, audio);

		this.updateStore();
		return audio;
	}

	public getByTag(tag: string) {
		return this.#audioObjectsByTag.get(tag);
	}

	public playByTag(tag: string) {
		this.audioActionByTag(tag, 'play');
	}
	public replayByTag(tag: string) {
		this.audioActionByTag(tag, 'replay');
	}
	public pauseByTag(tag: string) {
		this.audioActionByTag(tag, 'pause');
	}
	public stopByTag(tag: string) {
		this.audioActionByTag(tag, 'stop');
	}

	public rewindAll() {
		// TODO
	}
	public pauseAll() {
		// TODO
	}
	public stopAll() {
		// TODO
	}

	private audioActionByTag(tag: string, action: string) {
		const audio = this.getByTag(tag);
		if (!audio) return console.warn(`No audio object with tag '${tag}' found!`);
		(audio as unknown as Record<string, () => any>)[action]?.();
	}

	private actionOnAllAudioObjects() {
		// TODO
	}

	private updateStore() {
		this.#audioObjectsStore.set([...this.#audioObjects.values()]);
	}
}
