import { ButtonConfiguration } from '../Button/ButtonConfiguration';
import { ButtonHelper } from '../Button/ButtonHelper';
import { ButtonLayout } from '../Button/ButtonLayout';
import type { WindowButtonAction } from '../Button/WindowButton.svelte';
import { content } from '../Contents/Templates/NotificationTemplate.svelte';
import { DisplayWindow } from '../DisplayWindow.svelte';
import { WindowLayout } from '../WindowLayout.svelte';

export class NotificationWindow extends DisplayWindow<{ text: string }> {
	public constructor(
		text: string,
		title?: string,
		buttonConfiguration = ButtonConfiguration.OK,
		buttonActions?: WindowButtonAction[]
	) {
		super(0, content);
		this.alwaysOnTop = true;
		this.backdropVisible = true;
		this.maximizable = false;
		this.minimizable = false;
		this.objectClass = 'NOTIFICATION';
		this.layout = new WindowLayout({
			maximizeButton: false,
			minimizeButton: false,
			buttonLayout: ButtonLayout.CENTERED
		});
		this.props = { text };
		if (title) this.title = title;

		this.setButtons(ButtonHelper.buttonsFromConfiguration(buttonConfiguration, buttonActions));
	}
}
