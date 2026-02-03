export abstract class GameEvent {
	public eventTimestamp = new Date().getTime();

	public toString() {
		return `[${this.constructor.name}] timestamp: ${this.eventTimestamp}`;
	}
}
