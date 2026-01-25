import type { Snippet } from 'svelte';
import { Vec2 } from '../Vec2';
import { Vec4 } from '$lib/Vec4';
import { AnchorPoint } from './AnchorPoint';
import { WindowLayout } from './WindowLayout';
import { WindowButton } from './Button/WindowButton';
import { EventService } from '$lib/Event/EventService';
import { PredicateMode } from '$lib/PredicateMode';
import { WindowService } from '$lib/Window/WindowService';
import { WindowModificationEvent } from '$lib/Event/WindowModificationEvent';

export type WindowEditMode = 'moving' | 'resizing' | null;

export class DisplayWindow {
	public title = '';
	public windowClass = 'NONE';
	public layout = new WindowLayout();
	public minimizable = true;
	public maximizable = true;
	public resizeable = true;
	public draggable = true;
	public alwaysOnTop = false;
	public focused = true;
	public backdropVisible = false;
	public editMode: WindowEditMode = null;
	public customContainerStyle = '';
	public props?: Record<string, any>;
	#id = 0;
	#size = new Vec2(600, 400);
	#position = new Vec2();
	#dragBoundary = new Vec4(); // TODO
	#minimized = false;
	#maximized = false;
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

	public get minimized() {
		return this.#minimized;
	}
	public set minimized(minimized: boolean) {
		if (!this.minimizable && minimized) return;
		if (this.#maximized) {
			this.#maximized = false;
			this.position = new Vec2();
		}
		this.#minimized = minimized;

		EventService.dispatchEvent(new WindowModificationEvent(this));
	}

	public get maximized() {
		return this.#maximized;
	}
	public set maximized(maximized: boolean) {
		if (!this.maximizable && maximized) return;
		this.#minimized = false;
		if (!maximized) this.position = new Vec2();
		this.#maximized = maximized;

		EventService.dispatchEvent(new WindowModificationEvent(this));
	}

	public get size() {
		return this.#size;
	}
	public set size(size: Vec2) {
		if (!(size instanceof Vec2)) throw new TypeError('Invalid window property value provided - size must be a Vec2');

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
		if (!(size instanceof Vec2)) throw new TypeError('Invalid window property value provided - size must be a Vec2');
		if (size.x <= 0 || size.y <= 0)
			throw new Error(
				'Invalid window property value provided - size must be a Vec2 consisting of two positive numbers'
			);
		if (this.maxSize && (size.x > this.maxSize.x || size.y > this.maxSize.y))
			throw new Error('Invalid window property value provided - min size must be less than max size');

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

		if (!(size instanceof Vec2)) throw new TypeError('Invalid window property value provided - size must be a Vec2');
		if (size.x <= 0 || size.y <= 0)
			throw new Error(
				'Invalid window property value provided - size must be a Vec2 consisting of two positive numbers'
			);

		if (size.x < this.minSize.x || size.y < this.minSize.y)
			throw new Error('Invalid window property value provided - max size must be greater than min size');

		this.#maxSize = size;
	}
	public setMaxSize(w: number, h: number) {
		this.maxSize = new Vec2(w, h);
	}

	public get position() {
		return this.#position;
	}
	public set position(position: Vec2) {
		if (!(position instanceof Vec2))
			throw new TypeError('Invalid window property value provided - position must be a Vec2');
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
		if (typeof zIndex != 'number' || isNaN(zIndex))
			throw new TypeError('Invalid window property value provided - zIndex must be a numerical value');
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
		if (!WindowService.windowExists(dWindow))
			return console.warn(`Attempted to add already orphaned window to ${this}`);
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
		if (mode == 'moving' && !this.draggable) return;
		if (mode == 'resizing' && !this.resizeable) return;
		if (this.maximized) {
			if (mode != 'moving') return;
			this.maximized = false;
		}

		this.editMode = mode;
	}

	public close() {
		if (this.#parent) this.removeParent();
		this.clearChildren();
		this.#id = 0;
	}

	public get positioningCss() {
		if (this.maximized) return 'inset: 0;';

		const x = `${this.position.x}px`;
		const y = `${this.position.y}px`;

		let inset = '';
		// if (this.anchor == AnchorPoint.CENTER) TODO

		if (this.#anchor.y == 1) inset += `top: ${y}; `;
		else if (this.#anchor.y == -1) inset += `bottom: ${y}; `;
		if (this.#anchor.x == 1) inset += `left: ${x};`;
		else if (this.#anchor.x == -1) inset += `right: ${x};`;

		return `--x: ${x}; --y: ${y}; ${inset}`;
	}

	public get sizeCss() {
		const w = this.maximized ? '100%' : `${this.size.x}px`;
		const h = this.maximized ? '100%' : `${this.size.y}px`;
		const height = this.minimized ? '' : ' height: var(--h);';
		return `--w: ${w}; --h: ${h};${height}`;
	}

	public get css() {
		// TODO perhaps a StyleService that stores the rem font-size, so this isnt as hard coded?
		const overflow = this.size.x < 72 || this.size.y < 72 ? 'overflow: hidden;' : '';
		return `${this.positioningCss}
		${this.sizeCss}
		${overflow}
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
