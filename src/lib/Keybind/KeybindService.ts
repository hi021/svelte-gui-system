import { KeyAction } from './KeyActionEnum';

type KeyModifiers = { altKey: boolean; ctrlKey: boolean; shiftKey: boolean };
type Keybind = { action: KeyAction; modifiers: number; key?: string };

export class KeybindService {
	public static KEYMAP_LIST: Keybind[] = [];
	public static MODIFIERS_TO_KEYBINDS_MAP = new Map<number, Keybind[]>();
	public static ACTIONS_TO_KEYBINDS_MAP = new Map<KeyAction, Keybind[]>();

	static {
		KeybindService.KEYMAP_LIST = [
			{ action: KeyAction.WINDOW_CLOSE, modifiers: 0, key: 'escape' },
			{ action: KeyAction.WINDOW_MAXIMIZE, modifiers: KeybindService.getCtrlMod(), key: 'arrowup' },
			{ action: KeyAction.WINDOW_MINIMIZE, modifiers: KeybindService.getCtrlMod(), key: 'arrowdown' },
			{ action: KeyAction.WINDOW_OK, modifiers: 0, key: 'enter' },
			{ action: KeyAction.WINDOW_RESIZE_MOD, modifiers: KeybindService.getCtrlMod() }
		];
		// TODO: load existing keymap from settings to override any default keybinds

		KeybindService.buildModifiersToKeybindsMap();
		KeybindService.buildActionsToKeybindsMap();
	}

	// TODO consider returning multiple in an array
	public static getEventKeyAction(e: KeyboardEvent) {
		const key = KeybindService.getEventKey(e);
		const keybinds = KeybindService.MODIFIERS_TO_KEYBINDS_MAP.get(KeybindService.getEventModifiers(e)) ?? [];
		return keybinds.find((keybind) => keybind.key == key)?.action;
	}

	private static buildModifiersToKeybindsMap() {
		for (const keybind of KeybindService.KEYMAP_LIST) {
			const existingKeybinds = this.MODIFIERS_TO_KEYBINDS_MAP.get(keybind.modifiers) ?? [];
			KeybindService.MODIFIERS_TO_KEYBINDS_MAP.set(keybind.modifiers, [...existingKeybinds, keybind]);
		}
	}

	private static buildActionsToKeybindsMap() {
		// TODO
	}

	private static getAltMod() {
		return KeybindService.getModifiersBitfield({ altKey: true, ctrlKey: false, shiftKey: false } as KeyModifiers);
	}
	private static getCtrlMod() {
		return KeybindService.getModifiersBitfield({ altKey: false, ctrlKey: true, shiftKey: false } as KeyModifiers);
	}
	private static getShiftMod() {
		return KeybindService.getModifiersBitfield({ altKey: false, ctrlKey: false, shiftKey: true } as KeyModifiers);
	}
	private static getEventModifiers(e: KeyboardEvent) {
		const altKey = e.altKey || e.key == 'Alt';
		const ctrlKey = e.ctrlKey || e.key == 'Control';
		const shiftKey = e.shiftKey || e.key == 'Shift';
		const modifiers: KeyModifiers = { altKey, ctrlKey, shiftKey };
		return KeybindService.getModifiersBitfield(modifiers);
	}
	private static getEventKey(e: KeyboardEvent) {
		return e.key == 'Shift' || e.key == 'Control' || e.key == 'Alt' || e.key == 'Unidentified' ?
				null
			:	e.key.toLocaleLowerCase();
	}
	private static getModifiersBitfield(modifiers?: KeyModifiers) {
		if (!modifiers) return 0;
		return (+modifiers.altKey << 0) | (+modifiers.ctrlKey << 1) | (+modifiers.shiftKey << 2);
	}
}
