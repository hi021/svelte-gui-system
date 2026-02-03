import { MediaState } from './MediaState';

export class Audio {
	public objectClass = 'NONE';
	public path: string;
	public tag: string | undefined;
	public looping = $state(false);
	private _element: HTMLAudioElement | undefined; // Setter not to be used outside the svelte component!
	private _state = $state(MediaState.UNDEFINED); // Setter not to be used outside the svelte component!
	#id: number;
	#lazy: boolean;
	#volume = $state(0.5);
	#speed = $state(1);

	public constructor(id: number, path: string, tag?: string, lazy = true) {
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

	public get speed() {
		return this.#speed;
	}
	public set speed(speed: number) {
		this.#speed = Math.min(Math.max(0.1, speed), 10);
	}

	public get element() {
		return this._element;
	}

	public get state() {
		return this._state;
	}

	public get lazy() {
		return this.#lazy;
	}

	public play() {
		if (this._state == MediaState.UNDEFINED) {
			this._state = MediaState.READY;
			return setTimeout(() => this.play());
		}

		if (!this._element) return;
		this._element.play();
		// TODO EVENT
	}
	public rewind() {
		if (this._element) this._element.currentTime = 0;
	}
	public replay() {
		if (this._state == MediaState.PLAYING) this.rewind();
		else this.play();
	}
	public pause() {
		if (!this._element) return;
		this._element.pause();
		// TODO EVENT
	}
	public stop() {
		this.pause();
		this.rewind();
	}

	public remove() {
		this.#id = 0;
		this.stop();
		this._state = MediaState.UNDEFINED;
	}

	public toString() {
		return `AudioObject [#${this.#id}, CLASS: "${this.objectClass}"] (path: ${this.path}) state ${this._state} at ${this.volume} volume, ${this.speed}x speed"`;
	}
}
