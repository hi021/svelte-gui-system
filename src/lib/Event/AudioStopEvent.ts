import { AudioEvent } from './AudioEvent';

export class AudioStopEvent extends AudioEvent {
	public override readonly className: string = 'AudioStopEvent';
}
