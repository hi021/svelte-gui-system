import { MediaState } from './MediaState';

export class Audio {
	public objectClass = 'NONE';
	public path: string;
	public tag: string | undefined;
	public looping = $state(false);
	#id: number;
	#element: HTMLAudioElement | undefined;
	#lazy: boolean;
	#volume = $state(0.5);
	#state = $state(MediaState.UNDEFINED);
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

	public remove() {
		this.#id = 0;
		this.stop();
		this.state = MediaState.UNDEFINED;
	}

	public toString() {
		return `AudioObject [#${this.#id}, CLASS: "${this.objectClass}"] (path: ${this.path}) state ${this.#state} at ${this.volume} volume, ${this.speed}x speed"`;
	}
}
