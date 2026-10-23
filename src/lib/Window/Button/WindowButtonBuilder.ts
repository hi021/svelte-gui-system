import { AbstractBuilder } from '../../Builder/AbstractBuilder';
import type { WindowButtonAction } from './WindowButton.svelte';
import { WindowButton, type WindowButtonOptions } from './WindowButton.svelte';

export class WindowButtonBuilder extends AbstractBuilder<WindowButton> {
	private options: WindowButtonOptions = {};

	public withText(text: string | undefined) {
		this.options.text = text;
		return this;
	}

	public withIcon(icon: string | undefined) {
		this.options.icon = icon;
		return this;
	}

	public withAction(action: WindowButtonAction | undefined) {
		this.options.action = action;
		return this;
	}

	public withCustomStyle(customStyle: string | undefined) {
		this.options.customStyle = customStyle;
		return this;
	}

	public withButtonClass(buttonClass: string) {
		this.options.buttonClass = buttonClass;
		return this;
	}

	public build() {
		return new WindowButton(this.options);
	}
}
