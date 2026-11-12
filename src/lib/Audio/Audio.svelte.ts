import { AudioPlayEvent } from '../Event/AudioPlayEvent';
import { AudioStopEvent } from '../Event/AudioStopEvent';
import { EventService } from '../Event/EventService';
import Util from '../Util/Util';
import { registerAudioAccess } from './AudioInternal';
import { MediaState } from './MediaState';

export class Audio {
	public objectClass = 'NONE';
	public tag: string | undefined = $state(undefined);
	public looping = $state(false);
	#element: HTMLAudioElement | undefined = $state(undefined);
	#state = $state(MediaState.UNDEFINED);
	#playbackSchedule: number | undefined;
	#id: number;
	#path = '';
	#lazy: boolean;
	#volume = $state(0.5);
	#speed = $state(1);

	public constructor(id: number, path: string, tag?: string, lazy = true) {
		this.#id = id;
		this.tag = tag;
		this.#lazy = lazy;
		try {
			this.path = path;
		} catch {
			this.#state = MediaState.ERROR;
		}

		registerAudioAccess(this, {
			setElement: (element) => (this.#element = element),
			setState: (state) => (this.#state = state)
		});
	}

	public get path() {
		return this.#path;
	}
	public set path(path: string) {
		try {
			Util.validateLocalUrl(path);
			this.#path = path;
		} catch (error) {
			this.#state = MediaState.ERROR;
			throw error;
		}
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

	public get state() {
		return this.#state;
	}

	public get lazy() {
		return this.#lazy;
	}

	public play() {
		if (this.#state === MediaState.ERROR) return;

		if (this.#state === MediaState.UNDEFINED) {
			try {
				this.#state = MediaState.READY;
				this.#playbackSchedule = setTimeout(() => this.play());
			} catch {
				this.#state = MediaState.ERROR;
			}
			return;
		}

		if (!this.#element) return;
		try {
			void this.#element.play().catch(() => (this.#state = MediaState.ERROR));
		} catch {
			this.#state = MediaState.ERROR;
		}
		EventService.dispatchEvent(new AudioPlayEvent(this));
	}
	public rewind() {
		try {
			if (this.#element) this.#element.currentTime = 0;
		} catch {
			this.#state = MediaState.ERROR;
		}
	}
	public replay() {
		if (this.#state === MediaState.PLAYING) this.rewind();
		else this.play();
	}
	public pause() {
		if (!this.#element) return;
		try {
			this.#element.pause();
		} catch {
			this.#state = MediaState.ERROR;
		}
		EventService.dispatchEvent(new AudioStopEvent(this));
	}
	public stop() {
		try {
			this.pause();
			this.rewind();
			clearTimeout(this.#playbackSchedule);
			this.#playbackSchedule = undefined;
		} catch {
			this.#state = MediaState.ERROR;
		}
	}

	public remove() {
		this.#id = 0;
		this.stop();
		this.#state = MediaState.UNDEFINED;
	}

	public toString() {
		return `AudioObject [#${this.#id}, CLASS: "${this.objectClass}"] (path: ${this.path}) state ${this.#state} at ${this.volume} volume, ${this.speed}x speed"`;
	}
}
