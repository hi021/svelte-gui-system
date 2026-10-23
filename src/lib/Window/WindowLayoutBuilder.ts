import { AbstractBuilder } from '../Builder/AbstractBuilder';
import { ButtonLayout } from './Button/ButtonLayout';
import { WindowLayout, type WindowLayoutOptions } from './WindowLayout.svelte';

export class WindowLayoutBuilder extends AbstractBuilder<WindowLayout> {
	private options: WindowLayoutOptions = {};

	public withTitle(title: boolean) {
		this.options.title = title;
		return this;
	}

	public withMinimizeButton(minimizeButton: boolean) {
		this.options.minimizeButton = minimizeButton;
		return this;
	}

	public withMaximizeButton(maximizeButton: boolean) {
		this.options.maximizeButton = maximizeButton;
		return this;
	}

	public withCloseButton(closeButton: boolean) {
		this.options.closeButton = closeButton;
		return this;
	}

	public withButtonLayout(buttonLayout: ButtonLayout) {
		this.options.buttonLayout = buttonLayout;
		return this;
	}

	public withBorderRadius(borderRadius: number) {
		this.options.borderRadius = borderRadius;
		return this;
	}

	public withPadding(padding: number) {
		this.options.padding = padding;
		return this;
	}

	public build() {
		return new WindowLayout(this.options);
	}
}
