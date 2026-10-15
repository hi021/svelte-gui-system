import { AnchorPointX } from "./AnchorPointX";
import { AnchorPointY } from "./AnchorPointY";

export class AnchorVec {
	public x = AnchorPointX.LEFT;
	public y = AnchorPointY.TOP;

	public constructor(x = AnchorPointX.LEFT, y = AnchorPointY.TOP) {
		this.x = x;
		this.y = y;
	}

	public toString() {
		return `${this.x}-${this.y}`;
	}
}
