export abstract class ApplicationEvent {
	public readonly eventTimestamp = new Date().getTime();
	public readonly className: string = 'ApplicationEvent'; // constructor.name is pointless with minified code

	public toString() {
		return `[${this.className}] @${new Date(this.eventTimestamp).toISOString()}`;
	}
}
