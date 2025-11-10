import { ButtonLayout } from "./ButtonLayout";

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
}
