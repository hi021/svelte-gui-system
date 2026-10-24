export const Color = {
	DARKEST: 'var(--color-darkest)',
	DARKER: 'var(--color-darker)',
	DARK: 'var(--color-dark)',
	DARKISH: 'var(--color-darkish)',
	LIGHTEST: 'var(--color-lightest)',
	LIGHTER: 'var(--color-lighter)',
	LIGHT: 'var(--color-light)'
} as const;

export type Color = (typeof Color)[keyof typeof Color];
