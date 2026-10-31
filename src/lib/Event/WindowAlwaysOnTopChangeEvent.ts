import { WindowEvent } from './WindowEvent';

export class WindowAlwaysOnTopChangeEvent extends WindowEvent {
	public override readonly className: string = 'WindowAlwaysOnTopChangeEvent';
	public readonly alwaysOnTop: boolean;

	public constructor(sourceWindow: ConstructorParameters<typeof WindowEvent>[0], alwaysOnTop: boolean) {
		super(sourceWindow);
		this.alwaysOnTop = alwaysOnTop;
	}
}
