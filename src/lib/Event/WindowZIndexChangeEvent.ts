import { WindowEvent } from './WindowEvent';

export class WindowZIndexChangeEvent extends WindowEvent {
	public override readonly className: string = 'WindowZIndexChangeEvent';

	public constructor(
		sourceWindow: ConstructorParameters<typeof WindowEvent>[0],
		public readonly oldZIndex: number,
		public readonly newZIndex: number
	) {
		super(sourceWindow);
	}
}
