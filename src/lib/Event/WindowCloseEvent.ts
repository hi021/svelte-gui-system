import { WindowEvent } from './WindowEvent';

export class WindowCloseEvent extends WindowEvent {
	public override readonly className: string = 'WindowCloseEvent';
}
