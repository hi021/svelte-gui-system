import { ApplicationEvent } from './ApplicationEvent';

type EventConstructor<T extends ApplicationEvent = ApplicationEvent> = abstract new (...args: any[]) => T;
type EventListener<T extends ApplicationEvent> = (event: T) => void;
type ListenerRegistration = { listener: EventListener<ApplicationEvent> };

export class EventService {
	static #listeners = new Map<EventConstructor, Set<ListenerRegistration>>();

	// Returns an unsubscriber
	public static on<T extends ApplicationEvent>(eventClass: EventConstructor<T>, listener: EventListener<T>) {
		let listeners = this.#listeners.get(eventClass);
		if (!listeners) {
			listeners = new Set();
			this.#listeners.set(eventClass, listeners);
		}

		const registration: ListenerRegistration = { listener: listener as EventListener<ApplicationEvent> };
		listeners.add(registration);
		let active = true;

		return () => {
			if (!active) return;

			active = false;
			listeners.delete(registration);
			if (listeners.size === 0 && this.#listeners.get(eventClass) === listeners) this.#listeners.delete(eventClass);
		};
	}

	public static dispatchEvent(event: ApplicationEvent) {
		console.debug(`Received application event: ${event}`);

		const matchingRegistrations = [...this.#listeners]
			.filter(([eventClass]) => event instanceof eventClass)
			.flatMap(([, registrations]) => [...registrations].map((registration) => [registrations, registration] as const));

		for (const [registrations, registration] of matchingRegistrations) {
			if (registrations.has(registration)) registration.listener(event);
		}
	}
}
