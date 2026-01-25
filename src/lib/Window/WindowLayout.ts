import { ButtonLayout } from './Button/ButtonLayout';

export class WindowLayout {
	public title = true;
	public minimizeButton = true;
	public maximizeButton = true;
	public closeButton = true;
	public buttonLayout = ButtonLayout.EVENLY_SPACED;
	public borderRadius = 8; //px
	public padding = 8; //px

	public shouldRenderTitleBar() {
		return this.shouldRenderTitleBarButtonContainer() || this.title;
	}

	public shouldRenderTitleBarButtonContainer() {
		return this.closeButton || this.minimizeButton || this.maximizeButton;
	}

	public getButtonContainerClass() {
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
