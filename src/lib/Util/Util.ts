export type MethodsOnly<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
export type NonMethodsOnly<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type FieldsOnly<T> = Pick<T, NonMethodsOnly<T>>;

export function isEnumValue<T extends Object>(enumObj: T, value: unknown): value is T[keyof T] {
	return Object.values(enumObj).includes(value as T[keyof T]);
}
