import { ColorEnum } from './ColorEnum';

export class Color {
	public static COLOR_ENUM_MAP = new Map<ColorEnum, string>();
	static {
		Color.COLOR_ENUM_MAP.set(ColorEnum.DARKEST, '--color-darkest');
		Color.COLOR_ENUM_MAP.set(ColorEnum.DARKER, '--color-darker');
		Color.COLOR_ENUM_MAP.set(ColorEnum.DARK, '--color-dark');
		Color.COLOR_ENUM_MAP.set(ColorEnum.DARKISH, '--color-darkish');

		Color.COLOR_ENUM_MAP.set(ColorEnum.LIGHTEST, '--color-lightest');
		Color.COLOR_ENUM_MAP.set(ColorEnum.LIGHTER, '--color-lighter');
		Color.COLOR_ENUM_MAP.set(ColorEnum.LIGHT, '--color-light');

		Color.COLOR_ENUM_MAP.set(ColorEnum.PRIMARY, '--color-primary');
		Color.COLOR_ENUM_MAP.set(ColorEnum.SECONDARY, '--color-secondary');
		Color.COLOR_ENUM_MAP.set(ColorEnum.TERTIARY, '--color-tertiary');

		Color.COLOR_ENUM_MAP.set(ColorEnum.ERROR, '--color-error');
		Color.COLOR_ENUM_MAP.set(ColorEnum.WARNING, '--color-warning');
		Color.COLOR_ENUM_MAP.set(ColorEnum.SUCCESS, '--color-success');
		Color.COLOR_ENUM_MAP.set(ColorEnum.INFO, '--color-info');
	}

	public enumValue: ColorEnum | undefined;
	public stringValue: string | undefined; // any css value

	public constructor(color: ColorEnum | string) {
		if (typeof color == 'number') this.enumValue = color;
		else if (typeof color == 'string') this.stringValue = color;
		else
			throw new Error(
				'Unable to create an instance of Color - invalid argument type, must be either a ColorEnum or string'
			);
	}

	public get color() {
		return this.enumValue ? `var(${Color.COLOR_ENUM_MAP.get(this.enumValue)})` : this.stringValue;
	}

	public toString() {
		return this.color;
	}
}
