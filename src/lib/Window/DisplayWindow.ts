import type { Snippet } from "svelte";
import { Vec2 } from "../Vec2";
import { AnchorPoint } from "./AnchorPoint";
import { WindowLayout } from "./WindowLayout";
import { WindowButton } from "./Button/WindowButton";
import { PredicateMode } from "$lib/PredicateMode";
import { WindowService } from "$lib/Window/WindowService";

export type WindowEditMode = "moving" | "resizing" | null;

export class DisplayWindow {
	public title = "";
	public windowClass = "NONE";
	public layout = new WindowLayout();
	public minimizable = true;
	public maximizable = true;
	public resizeable = true;
	public draggable = true;
	public alwaysOnTop = false;
	public focused = true;
	public minimized = false;
	public maximized = false;
	public backdropVisible = false;
	public editMode: WindowEditMode = null;
	public customContainerStyle = "";
	public props?: Record<string, any>;
	#id = 0;
	#size = new Vec2(600, 400);
	#position = new Vec2(0, 0);
	#minSize = new Vec2(160, 32);
	#maxSize: Vec2 | undefined;
	#anchor = new Vec2(1, 1); // x = 1 -> left, x = -1 -> right; y = 1 -> top, y = -1 -> bottom (see getAnchorEnum())
	#zIndex = WindowService.DEFAULT_Z_INDEX;
	#buttons: WindowButton[] = [];
	#content: Snippet<[Record<string, any> | undefined]>;
	#parent?: DisplayWindow;
	#children: DisplayWindow[] = [];

	public constructor(id: number, content: Snippet<[Record<string, any> | undefined]>) {
		this.#id = id;
		this.#content = content;
	}

	public get id() {
		return this.#id;
	}
	public set id(id: number) {
		if (this.id) {
			console.warn(`Attempted to override id for ${this}`);
			return;
		}
		if (!id) {
			console.warn(`Attempted to unset id for ${this}`);
			return;
		}

		this.#id = id;
	}

	public get size() {
		return this.#size;
	}
	public set size(size: Vec2) {
		if (!(size instanceof Vec2)) throw new TypeError("Invalid window property value provided - size must be a Vec2");

		if (size.x < this.minSize.x) size.x = this.minSize.x;
		else if (this.maxSize && size.x > this.maxSize.x) size.x = this.maxSize.x;
		if (size.y < this.minSize.y) size.y = this.minSize.y;
		else if (this.maxSize && size.y > this.maxSize.y) size.y = this.maxSize.y;

		this.#size = size;
	}
	public setSize(w: number, h: number) {
		this.size = new Vec2(w, h);
	}

	public get minSize() {
		return this.#minSize;
	}
	public set minSize(size: Vec2) {
		if (!(size instanceof Vec2)) throw new TypeError("Invalid window property value provided - size must be a Vec2");
		if (size.x <= 0 || size.y <= 0)
			throw new Error(
				"Invalid window property value provided - size must be a Vec2 consisting of two positive numbers"
			);
		if (this.maxSize && (size.x > this.maxSize.x || size.y > this.maxSize.y))
			throw new Error("Invalid window property value provided - min size must be less than max size");

		this.#minSize = size;
	}
	public setMinSize(w: number, h: number) {
		this.minSize = new Vec2(w, h);
	}

	public get maxSize() {
		return this.#maxSize;
	}
	public set maxSize(size: Vec2 | undefined) {
		if (size == null) {
			this.#maxSize = undefined;
			return;
		}

		if (!(size instanceof Vec2)) throw new TypeError("Invalid window property value provided - size must be a Vec2");
		if (size.x <= 0 || size.y <= 0)
			throw new Error(
				"Invalid window property value provided - size must be a Vec2 consisting of two positive numbers"
			);

		if (size.x < this.minSize.x || size.y < this.minSize.y)
			throw new Error("Invalid window property value provided - max size must be greater than min size");

		this.#maxSize = size;
	}
	public setMaxSize(w: number, h: number) {
		this.maxSize = new Vec2(w, h);
	}

	// TODO bounding box to prevent dragging off screen
	public get position() {
		return this.#position;
	}
	public set position(position: Vec2) {
		if (!(position instanceof Vec2))
			throw new TypeError("Invalid window property value provided - position must be a Vec2");
		this.#position = position;
	}
	public setPosition(w: number, h: number) {
		this.#position = new Vec2(w, h);
	}

	public get anchor() {
		return this.#anchor;
	}

	public setAnchorEnum(anchor: AnchorPoint) {
		// TODO validate input
		const xAnchorSign = anchor == AnchorPoint.TOP_LEFT || anchor == AnchorPoint.BOTTOM_LEFT ? 1 : -1;
		const yAnchorSign = anchor == AnchorPoint.TOP_LEFT || anchor == AnchorPoint.TOP_RIGHT ? 1 : -1;
		this.#anchor = new Vec2(xAnchorSign, yAnchorSign);
	}

	public getAnchorEnum() {
		if (this.#anchor.x == 1) return this.#anchor.y == 1 ? AnchorPoint.TOP_LEFT : AnchorPoint.BOTTOM_LEFT;
		if (this.#anchor.x == -1) return this.#anchor.y == 1 ? AnchorPoint.TOP_RIGHT : AnchorPoint.BOTTOM_RIGHT;
		return AnchorPoint.CENTER; // TODO
	}

	public get zIndex() {
		return this.#zIndex;
	}
	public set zIndex(zIndex: number) {
		if (typeof zIndex != "number" || isNaN(zIndex))
			throw new TypeError("Invalid window property value provided - zIndex must be a numerical value");
		this.#zIndex = zIndex;
	}

	public get buttons() {
		return this.#buttons.map((button) => button.clone());
	}
	public set buttons(buttons: WindowButton[]) {
		for (const button of buttons ?? []) this.addButton(button);
	}

	public get content() {
		return this.#content;
	}

	public get parent() {
		return this.#parent;
	}
	// this also adds the current window as a child of the target parent
	public setParent(dWindow?: DisplayWindow) {
		if (!dWindow) return this.removeParent();
		if (this.#parent == dWindow) return;
		if (this.#children.includes(dWindow)) return console.warn(`Attempted to set existing child as parent for ${this}`);
		if (!WindowService.windowExists(dWindow)) return console.warn(`Attempted to set parent for ${this}`);

		dWindow.children.push(this);
		this.#parent = dWindow;
	}
	public removeParent() {
		if (!this.parent) return console.warn(`Attempted to remove inexistent parent from ${this}`);
		this.parent.removeChildOnly(this);
		this.#parent = undefined;
	}

	public get children() {
		return this.#children;
	}
	public addChild(dWindow: DisplayWindow) {
		if (!WindowService.windowExists(dWindow)) return console.warn();
	}
	public addChildren(dWindows: DisplayWindow[]) {
		for (const dWindow of dWindows) this.addChild(dWindow);
	}
	public removeChild(dWindow: DisplayWindow) {
		if (!dWindow) return;
		if (dWindow.parent != this) return console.warn(`Attempted to remove inexistent child from ${this}`);
		dWindow.removeParent();
	}
	public removeChildren(dWindows: DisplayWindow[]) {
		for (const dWindow of dWindows) this.removeChild(dWindow);
	}
	public clearChildren() {
		this.removeChildren(this.#children);
	}
	private removeChildOnly(dWindow: DisplayWindow) {
		this.#children = this.#children.filter((child) => child != dWindow);
	}

	public setEditMode(mode: WindowEditMode = null) {
		if (mode == "moving" && !this.draggable) return;
		if (mode == "resizing" && !this.resizeable) return;
		this.editMode = mode;
	}

	public close() {
		if (this.#parent) this.removeParent();
		this.clearChildren();
		this.#id = 0;
	}

	public get positioningCss() {
		const x = `${this.position.x}px`;
		const y = `${this.position.y}px`;

		let inset = "";
		// if (this.anchor == AnchorPoint.CENTER) TODO

		if (this.#anchor.y == 1) inset += `top: ${y}; `;
		else if (this.#anchor.y == -1) inset += `bottom: ${y}; `;
		if (this.#anchor.x == 1) inset += `left: ${x};`;
		else if (this.#anchor.x == -1) inset += `right: ${x};`;

		return `--x: ${x}; --y: ${y}; ${inset}`;
	}

	public get css() {
		return `${this.positioningCss}
    --w: ${this.size.x}px; --h: ${this.size.y}px;
    ${this.minimized ? "" : "height: var(--h);"}
    --border-radius: ${this.layout.borderRadius}px;
    --padding: ${this.layout.padding}px;
    --z-index: ${this.zIndex};
    ${this.customContainerStyle}`;
	}

	public setButtons(buttons: WindowButton[]) {
		this.#buttons = [];
		for (const button of buttons) this.addButton(button);
	}

	public addButton(button: WindowButton) {
		this.#buttons.push(button.clone());
	}

	public matchesPredicates(predicates: Record<string, any>, mode: PredicateMode) {
		// TODO: Some sort of validation for array/enum/object/class instance fields - those will probably not work
		const shallowCopyObj: Record<string, any> = { ...this };
		for (const property in predicates) {
			if (shallowCopyObj[property] == predicates[property]) {
				if (mode == PredicateMode.ANY) return true;
			} else if (mode == PredicateMode.ALL) {
				return false;
			}
		}

		return mode == PredicateMode.ALL;
	}

	public toString() {
		return `Window [#${this.#id}, CLASS: "${this.windowClass}"] (z: ${this.zIndex}) - "${this.title}"`;
	}
}
