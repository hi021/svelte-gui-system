import { EventService } from "$lib/Event/EventService";
import { WindowCloseEvent } from "$lib/Event/WindowCloseEvent";
import { ButtonConfiguration } from "../Button/ButtonConfiguration";
import { ButtonLayout } from "../Button/ButtonLayout";
import { WindowButton } from "../Button/WindowButton";
import { content } from "../Contents/Templates/NotificationTemplate.svelte";
import { DisplayWindow } from "../DisplayWindow";
import { WindowLayout } from "../WindowLayout";

export class NotificationWindow extends DisplayWindow {
	static #windowLayout = new WindowLayout();
	static {
		this.#windowLayout.maximizeButton = false;
		this.#windowLayout.minimizeButton = false;
		this.#windowLayout.buttonLayout = ButtonLayout.CENTERED;
	}

	public constructor(text: string, title?: string, buttonConfiguration = ButtonConfiguration.OK) {
		super(0, content);
		this.alwaysOnTop = true;
		this.backdropVisible = true;
		this.maximizable = false;
		this.minimizable = false;
		this.windowClass = "NOTIFICATION";
		this.layout = NotificationWindow.#windowLayout;
		this.props = { text };
		if (title) this.title = title;

		this.setButtons(this.createButtons(buttonConfiguration));
	}

	private createButtons(buttonConfiguration: ButtonConfiguration) {
		const okButton = new WindowButton();
		okButton.text = "OK";
		okButton.action = (e, dWindow) => EventService.dispatchEvent(new WindowCloseEvent(dWindow));

		return [okButton];
	}
}
