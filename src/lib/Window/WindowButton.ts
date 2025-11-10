export class WindowButton {
	public text: string | null = null;
	public icon: string | null = null;
	public action: (() => any) | null = null;

	public clone() {
		const cloned = new WindowButton();
		cloned.text = this.text;
		cloned.icon = this.icon;
		cloned.action = this.action;
		return cloned;
	}
}
