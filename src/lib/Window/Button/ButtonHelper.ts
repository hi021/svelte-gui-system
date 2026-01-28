import { EventService } from '$lib/Event/EventService';
import { WindowCloseEvent } from '$lib/Event/WindowCloseEvent';
import type { DisplayWindow } from '../DisplayWindow';
import { ButtonConfiguration } from './ButtonConfiguration';
import { WindowButton, type WindowButtonAction } from './WindowButton';

export type MinimalWindowArguments = {
	text?: string;
	icon?: string;
	action?: WindowButtonAction;
	buttonClass?: string;
};

export class ButtonHelper {
	public static buttonsFromConfiguration(buttonConfiguration: ButtonConfiguration, actions?: WindowButtonAction[]) {
		const buttons = new Array<WindowButton>();
		switch (buttonConfiguration) {
			case ButtonConfiguration.OK:
				buttons[0] = ButtonHelper.buildOkButton();
			case ButtonConfiguration.YES_NO:
				buttons[0] = ButtonHelper.buildYesButton();
				buttons[1] = ButtonHelper.buildNoButton();
		}

		if (actions?.length) {
			for (let i = 0; i < buttons.length; ++i) if (actions[i]) buttons[i].action = actions[i];
		}

		return buttons;
	}

	public static buildSimpleButton(args: MinimalWindowArguments) {
		const button = new WindowButton();
		button.text = args.text;
		button.action = args.action;
		button.icon = args.icon;
		if (args.buttonClass != null) button.buttonClass = args.buttonClass;
		return button;
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

	public static getWindowCloseAction() {
		return (e: MouseEvent, dWindow: DisplayWindow) => EventService.dispatchEvent(new WindowCloseEvent(dWindow));
	}
}
