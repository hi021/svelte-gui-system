import type { DisplayWindow } from '$lib/Window/DisplayWindow';
import { GameEvent } from './GameEvent';

export abstract class WindowEvent extends GameEvent {
	public sourceWindow: DisplayWindow;

	public constructor(sourceWindow: DisplayWindow) {
		super();
		this.sourceWindow = sourceWindow;
	}
}
