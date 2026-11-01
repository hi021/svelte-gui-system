export class Vec2 {
	public x = 0;
	public y = 0;

	public constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	public equals(other: Vec2) {
		return this.x === other.x && this.y === other.y;
	}

	public round() {
		return new Vec2(Math.round(this.x), Math.round(this.y));
	}

	public clone() {
		return new Vec2(this.x, this.y);
	}

	public toString() {
		return `(${this.x}, ${this.y})`;
	}
}
