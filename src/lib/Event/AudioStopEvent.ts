import { AudioEvent } from './AudioEvent';

// NOTE: This event is dispatched on pause, since stop() just pauses and rewinds audio.
export class AudioStopEvent extends AudioEvent {
	public override readonly className: string = 'AudioStopEvent';
}
