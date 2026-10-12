import type { DisplayWindow } from '../Window/DisplayWindow.svelte';
import { GameEvent } from './GameEvent';

export abstract class WindowEvent extends GameEvent {
	public sourceWindow: DisplayWindow<any>;

	public constructor(sourceWindow: DisplayWindow<any>) {
		super();
		this.sourceWindow = sourceWindow;
	}
}
