import type { DisplayWindow } from '../DisplayWindow.svelte';

export type WindowButtonAction = (e: MouseEvent, dWindow: DisplayWindow<any>) => unknown;

export type WindowButtonOptions = {
	text?: string;
	icon?: string;
	action?: WindowButtonAction;
	customStyle?: string;
	buttonClass?: string;
};

export class WindowButton {
	public text = $state<string | undefined>();
	public icon = $state<string | undefined>();
	public action = $state<WindowButtonAction | undefined>();
	public customStyle = $state<string | undefined>();
	public buttonClass = $state('NONE');

	public constructor(options?: WindowButtonOptions) {
		if (!options) return;

		this.text = options.text;
		this.icon = options.icon;
		this.action = options.action;
		this.customStyle = options.customStyle;
		this.buttonClass = options.buttonClass ?? 'NONE';
	}

	public clone() {
		const cloned = new WindowButton();
		cloned.text = this.text;
		cloned.icon = this.icon;
		cloned.action = this.action;
		cloned.customStyle = this.customStyle;
		cloned.buttonClass = this.buttonClass;
		return cloned;
	}
}
