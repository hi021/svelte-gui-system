export type MethodsOnly<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
export type NonMethodsOnly<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type FieldsOnly<T> = Pick<T, NonMethodsOnly<T>>;

export default class Util {
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
}
