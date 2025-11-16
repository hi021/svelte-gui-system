export class Vec4 {
	public a = 0;
	public b = 0;
	public c = 0;
	public d = 0;

	public constructor(a = 0, b = 0, c = 0, d = 0) {
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;
	}

	public round() {
		return new Vec4(Math.round(this.a), Math.round(this.b), Math.round(this.c), Math.round(this.d));
	}

	public clone() {
		return new Vec4(this.a, this.b, this.c, this.d);
	}

	public toString() {
		return `(${this.a}, ${this.b}; ${this.c}, ${this.d})`;
	}
}
