export class ColorService {
	private constructor() {}

	public static getColorName(colorVar: string) {
		const match = /^var\(\s*(--[\w-]+)\s*\)$/.exec(colorVar);
		return match?.[1] ?? null;
	}
}
