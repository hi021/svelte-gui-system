import { ButtonConfiguration } from '../Button/ButtonConfiguration';
import { ButtonHelper } from '../Button/ButtonHelper';
import { ButtonLayout } from '../Button/ButtonLayout';
import type { WindowButtonAction } from '../Button/WindowButton.svelte';
import { content } from '../Contents/Templates/NotificationTemplate.svelte';
import { DisplayWindow } from '../DisplayWindow.svelte';
import { WindowLayoutBuilder } from '../WindowLayoutBuilder';

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
		this.layout = new WindowLayoutBuilder()
			.withMaximizeButton(false)
			.withMinimizeButton(false)
			.withButtonLayout(ButtonLayout.CENTERED)
			.build();
		this.props = { text };
		if (title) this.title = title;

		this.setButtons(ButtonHelper.buttonsFromConfiguration(buttonConfiguration, buttonActions));
	}
}
