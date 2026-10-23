export const Color = {
	DARKEST: '--color-darkest',
	DARKER: '--color-darker',
	DARK: '--color-dark',
	DARKISH: '--color-darkish',
	LIGHTEST: '--color-lightest',
	LIGHTER: '--color-lighter',
	LIGHT: '--color-light',
	PRIMARY: '--color-primary',
	SECONDARY: '--color-secondary',
	TERTIARY: '--color-tertiary',
	QUATERNARY: '--color-quaternary',
	ERROR: '--color-error',
	WARNING: '--color-warning',
	SUCCESS: '--color-success',
	INFO: '--color-info'
} as const;

// TODO!: remove all except dark/light, tweak window colors, test extensibility

export type Color = (typeof Color)[keyof typeof Color];
