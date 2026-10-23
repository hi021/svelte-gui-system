export class ColorService {
	private constructor() {}

	public static toCss(color: string) {
		return `var(${color})`;
	}
}
