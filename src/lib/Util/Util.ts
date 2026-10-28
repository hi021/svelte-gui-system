import type { Attachment } from 'svelte/attachments';

export type MethodsOnly<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
export type NonMethodsOnly<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type FieldsOnly<T> = Pick<T, NonMethodsOnly<T>>;

export default class Util {
	private constructor() {}

	public static isEnumValue<T extends Object>(enumObj: T, value: unknown): value is T[keyof T] {
		return Object.values(enumObj).includes(value as T[keyof T]);
	}

	public static validateLocalUrl(value: string) {
		const location = globalThis.location;
		if (!location) throw new Error('Cannot resolve URL without an app location');

		let url: URL;
		try {
			url = new URL(value, location.href);
		} catch {
			throw new TypeError(`Invalid icon URL: "${value}"`);
		}

		const appUrl = new URL(location.href);
		if (
			url.protocol !== appUrl.protocol ||
			url.origin === 'null' ||
			url.origin !== appUrl.origin ||
			url.username ||
			url.password
		)
			throw new TypeError(`Icon URL must be a local resource: "${value}"`);

		return url;
	}

	public static trapFocus(node: HTMLElement) {
		function getFocusable() {
			return Array.from(
				node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
			);
		}

		function handleTrapFocusKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Tab') return;

			const current = document.activeElement;
			const elements = getFocusable() as HTMLElement[];
			const first = elements.at(0);
			const last = elements.at(-1);

			if (event.shiftKey && current === first) {
				last?.focus();
				event.preventDefault();
			}
			if (!event.shiftKey && current === last) {
				first?.focus();
				event.preventDefault();
			}
		}

		const previous = document.activeElement as HTMLElement | null;
		(getFocusable()[0] as HTMLElement | undefined)?.focus();

		node.addEventListener('keydown', handleTrapFocusKeyDown);
		return {
			destroy() {
				node.removeEventListener('keydown', handleTrapFocusKeyDown);
				previous?.focus();
			}
		};
	}

	public static onClickOutside(node: HTMLElement): Attachment {
		function handleOutsideClick(e: MouseEvent) {
			if (!e.composedPath().includes(e.target!)) node.dispatchEvent(new CustomEvent('outsideclick'));
		}

		window.addEventListener('click', handleOutsideClick);
		return () => window.removeEventListener('click', handleOutsideClick);
	}
}
