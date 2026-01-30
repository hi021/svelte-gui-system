import type { MethodsOnly } from '$lib/Util/Util';
import { writable } from 'svelte/store';
import { Audio } from './Audio.svelte';

export class AudioService {
	static readonly MAX_AUDIO_OBJECTS = 512;

	readonly #audioObjectsByTag = new Map<string, Audio>();
	readonly #audioObjects = new Map<number, Audio>();
	#audioObjectsStore = writable<Audio[]>([]);
	#playingAudioObjects = new Array<Audio>(); // TODO EVENTS
	#audioIdSequence = 1;

	public get audioObjects() {
		return this.#audioObjectsStore;
	}

	public registerAudioObject(path: string, tag?: string, lazy = true) {
		if (this.#audioObjects.size >= AudioService.MAX_AUDIO_OBJECTS)
			throw new Error(
				`Failed to register audio object: maximum number of audio objects is ${AudioService.MAX_AUDIO_OBJECTS}`
			);

		// TODO maybe a register or return existing method?
		// TODO should probably validate if path exists - silent errors would suck

		if (tag != null && this.getByTag(tag))
			throw new Error(`Failed to register audio object: an audio object with tag '${tag}' already exists`);
		if (this.getByPath(path))
			console.warn(`An audio object with path '${path}' already exists - consider reusing it instead`);

		const audio = new Audio(this.#audioIdSequence, path, tag, lazy);
		this.#audioObjects.set(this.#audioIdSequence++, audio);
		if (tag != null) this.#audioObjectsByTag.set(tag, audio);

		const methodCache = new Map<PropertyKey, any>();
		const proxy = new Proxy(audio, {
			get: (target, prop, _) => {
				if (!this.#audioObjects.has(audio.id)) throw new Error(`Attempting to access unregistered object: ${target}`);

				const value = Reflect.get(target, prop, target);
				if (typeof value !== 'function') return value;
				if (!methodCache.has(prop)) methodCache.set(prop, value.bind(target));
				return methodCache.get(prop);
			},
			set: (target, prop, value, _) => {
				if (!this.#audioObjects.has(audio.id)) throw new Error(`Attempting to access unregistered object: ${target}`);

				return Reflect.set(target, prop, value, target);
			}
		});

		this.updateStore();
		return proxy;
	}

	public unregisterAudioObject({ audio, tag, path }: { audio?: Audio; tag?: string; path?: string }) {
		if (audio) return this.unregisterAudioObjectById(audio.id);
		if (tag != null) {
			const audio = this.getByTag(tag);
			if (audio) return this.unregisterAudioObjectById(audio.id);
		}
		if (path) {
			const audio = this.getByPath(path);
			if (audio) return this.unregisterAudioObjectById(audio.id);
		}

		return false;
	}
	public unregisterAudioObjectById(id: number) {
		const audio = this.getById(id);
		if (!id || !audio) return false;

		audio.remove();
		this.#audioObjects.delete(id);
		if (audio.tag != null) this.#audioObjectsByTag.delete(audio.tag);

		this.updateStore();
		return true;
	}

	public getById(id: number) {
		return id ? this.#audioObjects.get(id) : undefined;
	}
	public getByPath(path: string) {
		if (!path) return undefined;

		for (const [_, audioObject] of this.#audioObjects) {
			if (audioObject.path == path) return audioObject;
		}

		return undefined;
	}
	public getByTag(tag: string) {
		return tag != null ? this.#audioObjectsByTag.get(tag) : undefined;
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

	private audioActionByTag(tag: string, action: MethodsOnly<Audio>) {
		const audio = this.getByTag(tag);
		if (!audio) return console.warn(`No audio object with tag '${tag}' found!`);
		audio[action]();
	}

	private actionOnAllAudioObjects() {
		// TODO
	}

	public debugAllObjects() {
		let debugString = '';
		for (const [i, object] of this.#audioObjects) debugString += i + '\t' + object.toString() + '\n';
		console.log(debugString);
	}

	private updateStore() {
		this.#audioObjectsStore.set([...this.#audioObjects.values()]);
	}
}
