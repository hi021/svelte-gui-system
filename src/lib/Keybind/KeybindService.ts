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
		// TODO!: load existing keymap to override any default keybinds
		// TODO!: edit single bindings to allow rebind menus

		KeybindService.buildModifiersToKeybindsMap();
		KeybindService.buildActionsToKeybindsMap();
	}

	// TODO consider returning multiple in an array (filter())
	public static getEventKeyAction(e: KeyboardEvent) {
		const key = KeybindService.getEventKey(e);
		const keybinds = KeybindService.MODIFIERS_TO_KEYBINDS_MAP.get(KeybindService.getEventModifiers(e)) ?? [];
		return keybinds.find((keybind) => keybind.key === key)?.action;
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

	private static getCtrlMod() {
		return KeybindService.buildModifiersBitfield({ altKey: false, ctrlKey: true, shiftKey: false } as KeyModifiers);
	}
	private static getEventModifiers(e: KeyboardEvent) {
		const altKey = e.altKey || e.key === 'Alt';
		const ctrlKey = e.ctrlKey || e.key === 'Control';
		const shiftKey = e.shiftKey || e.key === 'Shift';
		const modifiers: KeyModifiers = { altKey, ctrlKey, shiftKey };
		return KeybindService.buildModifiersBitfield(modifiers);
	}
	private static getEventKey(e: KeyboardEvent) {
		return e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Unidentified' ?
				undefined
			:	e.key.toLocaleLowerCase();
	}
	private static buildModifiersBitfield(modifiers?: KeyModifiers) {
		if (!modifiers) return 0;
		return (+modifiers.altKey << 0) | (+modifiers.ctrlKey << 1) | (+modifiers.shiftKey << 2);
	}
}
