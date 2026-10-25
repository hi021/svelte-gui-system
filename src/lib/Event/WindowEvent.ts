import type { DisplayWindow } from '../Window/DisplayWindow.svelte';
import { ApplicationEvent } from './ApplicationEvent';

export abstract class WindowEvent extends ApplicationEvent {
	public override readonly className: string = 'WindowEvent';
	public readonly sourceWindow: DisplayWindow<any>;

	public constructor(sourceWindow: DisplayWindow<any>) {
		super();
		this.sourceWindow = sourceWindow;
	}
}
