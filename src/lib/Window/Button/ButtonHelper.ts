import { EventService } from '../../Event/EventService';
import { WindowCloseEvent } from '../../Event/WindowCloseEvent';
import type { DisplayWindow } from '../DisplayWindow.svelte';
import { ButtonConfiguration } from './ButtonConfiguration';
import { WindowButton, type WindowButtonAction } from './WindowButton.svelte';
import { WindowButtonBuilder } from './WindowButtonBuilder';

export type MinimalWindowArguments = {
	text?: string;
	icon?: string;
	action?: WindowButtonAction;
	buttonClass?: string;
};

export class ButtonHelper {
	private constructor() {}

	public static buttonsFromConfiguration(buttonConfiguration: ButtonConfiguration, actions?: WindowButtonAction[]) {
		const buttons = new Array<WindowButton>();
		switch (buttonConfiguration) {
			case ButtonConfiguration.OK:
				buttons[0] = ButtonHelper.buildOkButton();
				break;
			case ButtonConfiguration.YES_NO:
				buttons[0] = ButtonHelper.buildYesButton();
				buttons[1] = ButtonHelper.buildNoButton();
		}

		if (actions?.length) {
			for (let i = 0; i < buttons.length; ++i) if (actions[i]) buttons[i]!.action = actions[i];
		}

		return buttons;
	}

	public static buildSimpleButton(args: MinimalWindowArguments) {
		return new WindowButtonBuilder()
			.withText(args.text)
			.withAction(args.action)
			.withIcon(args.icon)
			.withButtonClass(args.buttonClass ?? 'NONE')
			.build();
	}
	public static buildOkButton() {
		return ButtonHelper.buildSimpleButton({ text: 'OK', buttonClass: 'BTN_OK', action: this.getWindowCloseAction() });
	}
	public static buildYesButton() {
		return ButtonHelper.buildSimpleButton({ text: 'Yes', buttonClass: 'BTN_YES' });
	}
	public static buildNoButton() {
		return ButtonHelper.buildSimpleButton({ text: 'No', buttonClass: 'BTN_NO' });
	}

	public static getWindowCloseAction(): WindowButtonAction {
		return (_: MouseEvent, dWindow: DisplayWindow) => EventService.dispatchEvent(new WindowCloseEvent(dWindow));
	}
}
