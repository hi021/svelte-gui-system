import { AnchorPointX } from './AnchorPointX';
import { AnchorPointY } from './AnchorPointY';

export class AnchorVec {
	public x = AnchorPointX.LEFT;
	public y = AnchorPointY.TOP;

	public static TOP_LEFT() {
		return new AnchorVec(AnchorPointX.LEFT, AnchorPointY.TOP);
	}
	public static TOP_CENTER() {
		return new AnchorVec(AnchorPointX.CENTER, AnchorPointY.TOP);
	}
	public static TOP_RIGHT() {
		return new AnchorVec(AnchorPointX.RIGHT, AnchorPointY.TOP);
	}
	public static CENTER_LEFT() {
		return new AnchorVec(AnchorPointX.LEFT, AnchorPointY.CENTER);
	}
	public static CENTER() {
		return new AnchorVec(AnchorPointX.CENTER, AnchorPointY.CENTER);
	}
	public static CENTER_RIGHT() {
		return new AnchorVec(AnchorPointX.RIGHT, AnchorPointY.CENTER);
	}
	public static BOTTOM_LEFT() {
		return new AnchorVec(AnchorPointX.LEFT, AnchorPointY.BOTTOM);
	}
	public static BOTTOM_CENTER() {
		return new AnchorVec(AnchorPointX.CENTER, AnchorPointY.BOTTOM);
	}
	public static BOTTOM_RIGHT() {
		return new AnchorVec(AnchorPointX.RIGHT, AnchorPointY.BOTTOM);
	}

	public constructor(x = AnchorPointX.LEFT, y = AnchorPointY.TOP) {
		this.x = x;
		this.y = y;
	}

	public toString() {
		return `${this.x}-${this.y}`;
	}
}
