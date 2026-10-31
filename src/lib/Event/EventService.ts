import { readonly, writable } from 'svelte/store';
import { ApplicationEvent } from './ApplicationEvent';
import { AudioPlayEvent } from './AudioPlayEvent';
import { AudioStopEvent } from './AudioStopEvent';
import { WindowAlwaysOnTopChangeEvent } from './WindowAlwaysOnTopChangeEvent';
import { WindowCloseEvent } from './WindowCloseEvent';
import { WindowZIndexChangeEvent } from './WindowZIndexChangeEvent';

export class EventService {
	static #windowCloseEvent = writable<WindowCloseEvent>();
	static #windowAlwaysOnTopChangeEvent = writable<WindowAlwaysOnTopChangeEvent>();
	static #windowZIndexChangeEvent = writable<WindowZIndexChangeEvent>();
	static #audioPlayEvent = writable<AudioPlayEvent>();
	static #audioStopEvent = writable<AudioStopEvent>();
	public static get windowCloseEvent() {
		return readonly(this.#windowCloseEvent);
	}
	public static get windowAlwaysOnTopChangeEvent() {
		return readonly(this.#windowAlwaysOnTopChangeEvent);
	}
	public static get windowZIndexChangeEvent() {
		return readonly(this.#windowZIndexChangeEvent);
	}
	public static get audioPlayEvent() {
		return readonly(this.#audioPlayEvent);
	}
	public static get audioStopEvent() {
		return readonly(this.#audioStopEvent);
	}

	public static dispatchEvent(event: ApplicationEvent) {
		console.debug(`Received application event: ${event}`);

		if (event instanceof WindowCloseEvent) {
			return this.#windowCloseEvent.set(event);
		}
		if (event instanceof WindowAlwaysOnTopChangeEvent) {
			return this.#windowAlwaysOnTopChangeEvent.set(event);
		}
		if (event instanceof WindowZIndexChangeEvent) {
			return this.#windowZIndexChangeEvent.set(event);
		}
		if (event instanceof AudioPlayEvent) {
			return this.#audioPlayEvent.set(event);
		}
		if (event instanceof AudioStopEvent) {
			return this.#audioStopEvent.set(event);
		}

		console.warn(`Attempted to create application event without dispatcher: ${event}`);
	}
}
