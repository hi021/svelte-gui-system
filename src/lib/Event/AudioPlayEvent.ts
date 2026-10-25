import { AudioEvent } from './AudioEvent';

export class AudioPlayEvent extends AudioEvent {
	public override readonly className: string = 'AudioPlayEvent';
}
