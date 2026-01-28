import { MediaState } from './MediaState';

export class Audio {
	#id: number;
	#element: HTMLAudioElement | undefined;
	#lazy: boolean; // TODO: only build HTML element on first play() call
	#volume = 0.5;
	#state = $state(MediaState.UNDEFINED);
	public class = 'NONE';
	public tag: string | undefined;
	public path: string;
	public speed = 1;
	public looping = false;

	public constructor(id: number, path: string, tag?: string, lazy = false) {
		this.#id = id;
		this.path = path;
		this.tag = tag;
		this.#lazy = lazy;
	}

	public get id() {
		return this.#id;
	}
	public set id(id: number) {
		if (this.id) {
			console.warn(`Attempted to override id for ${this}`);
			return;
		}
		if (!id) {
			console.warn(`Attempted to unset id for ${this}`);
			return;
		}

		this.#id = id;
	}

	public get volume() {
		return this.#volume;
	}
	public set volume(volume: number) {
		this.#volume = Math.min(Math.max(0, volume), 1);
	}

	public get element() {
		return this.#element;
	}
	// WARNING: Not to be used outside the svelte component!
	public set element(element: HTMLAudioElement | undefined) {
		this.#element = element;
	}

	public get state() {
		return this.#state;
	}
	// WARNING: Not to be used outside the svelte component!
	public set state(state: MediaState) {
		this.#state = state;
	}

	public get lazy() {
		return this.#lazy;
	}

	public play() {
		if (this.state == MediaState.UNDEFINED) {
			this.state = MediaState.READY;
			return setTimeout(() => this.play());
		}

		if (!this.#element) return;
		this.#element.play();
		// TODO EVENT
	}
	public rewind() {
		if (this.#element) this.#element.currentTime = 0;
	}
	public replay() {
		if (this.state == MediaState.PLAYING) this.rewind();
		else this.play();
	}
	public pause() {
		if (!this.#element) return;
		this.#element.pause();
		// TODO EVENT
	}
	public stop() {
		this.pause();
		this.rewind();
	}
}
