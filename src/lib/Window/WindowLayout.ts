import type { FieldsOnly } from '$lib/Util/Util';
import { ButtonLayout } from './Button/ButtonLayout';

export class WindowLayout {
	public title = true;
	public minimizeButton = true;
	public maximizeButton = true;
	public closeButton = true;
	public buttonLayout = ButtonLayout.EVENLY_SPACED;
	public borderRadius = 8; //px
	public padding = 8; //px

	public constructor(
		options?: Partial<FieldsOnly<Omit<WindowLayout, 'fullTitleBar' | 'titleBarButtons' | 'buttonContainerClass'>>>
	) {
		if (!options) return;

		this.title = options.title ?? true;
		this.minimizeButton = options.minimizeButton ?? true;
		this.maximizeButton = options.maximizeButton ?? true;
		this.closeButton = options.closeButton ?? true;
		this.buttonLayout = options.buttonLayout ?? ButtonLayout.EVENLY_SPACED;
		this.borderRadius = options.borderRadius ?? 8;
		this.padding = options.padding ?? 8;
	}

	public get fullTitleBar() {
		return this.titleBarButtons || this.title;
	}
	public set fullTitleBar(value: boolean) {
		this.titleBarButtons = value;
		this.title = value;
	}

	public get titleBarButtons() {
		return this.closeButton || this.minimizeButton || this.maximizeButton;
	}
	public set titleBarButtons(value: boolean) {
		this.closeButton = value;
		this.minimizeButton = value;
		this.maximizeButton = value;
	}

	public get buttonContainerClass() {
		switch (this.buttonLayout) {
			case ButtonLayout.CENTERED:
				return 'flex-centered';
			case ButtonLayout.EVENLY_SPACED:
				return 'flex-evenly-spaced';
			case ButtonLayout.LEFT_TO_RIGHT:
				return 'flex-ltr';
			case ButtonLayout.RIGHT_TO_LEFT:
				return 'flex-rtl';
			case ButtonLayout.SPACE_BETWEEN:
				return 'flex-space-between';
		}
	}
}
