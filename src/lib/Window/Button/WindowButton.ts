import type { DisplayWindow } from "../DisplayWindow";

export class WindowButton {
	public text: string | undefined;
	public icon: string | undefined;
	public action: ((e: MouseEvent, dWindow: DisplayWindow) => any) | undefined;
	public customStyle: string | undefined;
	public buttonClass = "NONE";

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
