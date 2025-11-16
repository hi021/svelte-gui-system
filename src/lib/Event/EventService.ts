import { readonly, writable } from "svelte/store";
import { WindowCloseEvent } from "./WindowCloseEvent";
import { GameEvent } from "./GameEvent";
import { WindowModificationEvent } from "./WindowModificationEvent";

export class EventService {
	static #windowCloseEvent = writable<WindowCloseEvent>();
	static #windowModificationEvent = writable<WindowModificationEvent>();
	public static get windowCloseEvent() {
		return readonly(this.#windowCloseEvent);
	}
	public static get windowModificationEvent() {
		return readonly(this.#windowModificationEvent);
	}

	public static dispatchEvent(event: GameEvent) {
		console.debug("Received game event: ", event);

		if (event instanceof WindowCloseEvent) {
			return this.#windowCloseEvent.set(event);
		}
		if (event instanceof WindowModificationEvent) {
			return this.#windowModificationEvent.set(event);
		}

		console.warn(`Unknown game event received: ${event}`);
	}
}
