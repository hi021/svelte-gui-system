import { readonly, writable } from "svelte/store";
import { WindowCloseEvent } from "./WindowCloseEvent";
import { GameEvent } from "./GameEvent";

export class EventService {
	static #windowCloseEvent = writable<WindowCloseEvent>();
	public static get windowCloseEvent() {
		return readonly(this.#windowCloseEvent);
	}

	// #eventStore = writable<GameEvent>();
	// public constructor() {
	//   this.#eventStore.subscribe(event => {
	//     if(event instanceof WindowCloseEvent) {

	//     }
	//   })
	// }

	public static dispatchEvent(event: GameEvent) {
		console.debug("Received game event: ", event);
		if (event instanceof WindowCloseEvent) {
			return this.#windowCloseEvent.set(event);
		}

		console.warn(`Unknown game event received: ${event}`);
	}
}
