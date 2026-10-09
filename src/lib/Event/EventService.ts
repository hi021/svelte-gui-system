import { readonly, writable } from 'svelte/store';
import { AudioPlayEvent } from './AudioPlayEvent';
import { AudioStopEvent } from './AudioStopEvent';
import { GameEvent } from './GameEvent';
import { WindowCloseEvent } from './WindowCloseEvent';

export class EventService {
	static #windowCloseEvent = writable<WindowCloseEvent>();
	static #audioPlayEvent = writable<AudioPlayEvent>();
	static #audioStopEvent = writable<AudioStopEvent>();
	public static get windowCloseEvent() {
		return readonly(this.#windowCloseEvent);
	}
	public static get audioPlayEvent() {
		return readonly(this.#audioPlayEvent);
	}
	public static get audioStopEvent() {
		return readonly(this.#audioStopEvent);
	}

	public static dispatchEvent(event: GameEvent) {
		console.debug('Received game event: ', event);

		if (event instanceof WindowCloseEvent) {
			return this.#windowCloseEvent.set(event);
		}
		if (event instanceof AudioPlayEvent) {
			return this.#audioPlayEvent.set(event);
		}
		if (event instanceof AudioStopEvent) {
			return this.#audioStopEvent.set(event);
		}

		console.warn(`Unknown game event received: ${event}`);
	}
}
