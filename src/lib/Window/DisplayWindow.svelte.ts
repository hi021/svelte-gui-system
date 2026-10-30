import type { Snippet } from 'svelte';
import { fly, slide } from 'svelte/transition';
import { PredicateMode } from '../Util/PredicateMode';
import Util from '../Util/Util';
import { Vec2 } from '../Util/Vec2';
import { AnchorPointX } from './AnchorPointX';
import { AnchorPointY } from './AnchorPointY';
import { AnchorVec } from './AnchorVec';
import { WindowButton } from './Button/WindowButton.svelte';
import { registerWindowAccess } from './DisplayWindowInternal';
import { WindowLayout } from './WindowLayout.svelte';
import { WindowService } from './WindowService.svelte';

export type WindowEditMode = 'moving' | 'resizing' | null;
export type ContentWrapperTransition = (node: Element, params: { duration: number }) => ReturnType<typeof slide>;

export class DisplayWindow<P extends object = Record<string, unknown>> {
	// TODO: focus window with existing tag on creation
	// TODO: reduced motion (disable animations)
	public objectClass = 'NONE';
	public readonly tag?: string;
	public title = $state('');
	public layout = $state(new WindowLayout());
	public minimizable = $state(true);
	public maximizable = $state(true);
	public resizeable = $state(true);
	public draggable = $state(true);
	public backdropVisible = $state(false);
	public customWindowContainerCss = $state('');
	public customContentContainerCss = $state('');
	public props = $state<P | undefined>();
	#element: HTMLDivElement | undefined = $state(undefined);
	#id = $state(0);
	#size = $state(new Vec2(600, 400));
	#initialSize: Vec2 | undefined;
	#hasExplicitSize = false;
	#contentWrapperTransition: ContentWrapperTransition | undefined;
	#position = $state(new Vec2());
	#initialPosition: Vec2 | undefined;
	#alwaysOnTop = $state(false);
	#editMode = $state<WindowEditMode>(null);
	#minimized = $state(false);
	#maximized = $state(false);
	#minSize = $state(new Vec2(160, 0));
	#maxSize = $state<Vec2 | undefined>();
	#anchor = new AnchorVec();
	#zIndex = $state(WindowService.BOTTOM_Z_INDEX);
	#buttons = $state<WindowButton[]>([]);
	#content: Snippet<[P | undefined]>;
	#parent: DisplayWindow<any> | undefined;
	#children = $state<DisplayWindow<any>[]>([]);

	public constructor(id: number, content: Snippet<[P | undefined]>, tag?: string) {
		this.#id = id;
		this.#content = content;
		this.tag = tag;
		registerWindowAccess(this, (element) => (this.#element = element));
	}

	public get id() {
		return this.#id;
	}
	public set id(id: number) {
		if (!id) {
			console.warn(`Attempted to unset id for ${this}`);
			return;
		}
		if (this.id) {
			console.warn(`Attempted to override id for ${this}`);
			return;
		}

		this.#id = id;
	}

	// Only use in case of emergency!
	public get element() {
		return this.#element;
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
	}

	public get maximized() {
		return this.#maximized;
	}
	public set maximized(maximized: boolean) {
		if (!this.maximizable && maximized) return;
		this.#minimized = false;
		if (!maximized) this.position = new Vec2();
		this.#maximized = maximized;
	}

	public get windowState() {
		if (this.minimized) return 'minimized';
		if (this.maximized) return 'maximized';
		return 'default';
	}

	public get size() {
		return new Vec2(this.#size.x, this.#size.y);
	}
	public get initialSize() {
		return this.#initialSize === undefined ? undefined : new Vec2(this.#initialSize.x, this.#initialSize.y);
	}
	public set size(size: Vec2) {
		if (!(size instanceof Vec2)) throw new TypeError('Invalid window property value provided - size must be a Vec2');
		this.#hasExplicitSize = true;

		const ownedSize = new Vec2(size.x, size.y);
		if (ownedSize.x < this.#minSize.x) ownedSize.x = this.#minSize.x;
		else if (this.#maxSize && ownedSize.x > this.#maxSize.x) ownedSize.x = this.#maxSize.x;
		if (ownedSize.y < this.#minSize.y) ownedSize.y = this.#minSize.y;
		else if (this.#maxSize && ownedSize.y > this.#maxSize.y) ownedSize.y = this.#maxSize.y;

		this.#size = ownedSize;
	}

	public get hasExplicitSize() {
		return this.#hasExplicitSize;
	}
	// NOTE: Non-explicit size windows should not use layout-altering size transitions
	public get contentWrapperTransition(): ContentWrapperTransition {
		return (
			this.#contentWrapperTransition ??
			(this.#hasExplicitSize ? slide : (node, params) => fly(node, { ...params, y: 8 }))
		);
	}
	public set contentWrapperTransition(transition: ContentWrapperTransition | undefined) {
		this.#contentWrapperTransition = transition;
	}
	public scaleToContent() {
		const element = this.#element;
		const contentWrapper = element?.querySelector<HTMLElement>('.display-window-content-wrapper');
		const content = element?.querySelector<HTMLElement>('.display-window-content');
		const titleBar = element?.querySelector<HTMLElement>('.display-window-titlebar');
		if (!element || !contentWrapper || !content) return false;

		const elementStyle = element.style.cssText;
		const wrapperStyle = contentWrapper.style.cssText;
		const contentStyle = content.style.cssText;
		let width: number;
		let height: number;

		try {
			element.style.setProperty('width', 'max-content', 'important');
			element.style.setProperty('height', 'auto', 'important');
			element.style.setProperty('transform', 'none', 'important');
			contentWrapper.style.setProperty('height', 'auto', 'important');
			contentWrapper.style.setProperty('flex', 'none', 'important');
			content.style.setProperty('flex', 'none', 'important');

			width = element.getBoundingClientRect().width;
			if (this.#maxSize && width > this.#maxSize.x) width = this.#maxSize.x;
			if (width < this.#minSize.x) width = this.#minSize.x;

			element.style.setProperty('width', `${width}px`, 'important');
			height = element.getBoundingClientRect().height - (titleBar?.getBoundingClientRect()?.height ?? 0);
		} finally {
			element.style.cssText = elementStyle;
			contentWrapper.style.cssText = wrapperStyle;
			content.style.cssText = contentStyle;
		}

		this.size = new Vec2(width, height);
		return true;
	}
	public setSize(w?: number, h?: number) {
		this.size = new Vec2(w ?? this.#size.x, h ?? this.#size.y);
	}
	public resetSize() {
		if (this.#initialSize === undefined)
			throw new Error(
				'Size cannot be reset - window has no initial size, possibly because it did not finish initializing'
			);
		this.size = this.initialSize as Vec2;
	}

	public get minSize() {
		return new Vec2(this.#minSize.x, this.#minSize.y);
	}
	public set minSize(size: Vec2) {
		if (!(size instanceof Vec2)) throw new TypeError('Invalid window property value provided - size must be a Vec2');
		if (size.x <= 0 || size.y <= 0)
			throw new Error(
				'Invalid window property value provided - size must be a Vec2 consisting of two positive numbers'
			);
		if (this.#maxSize && (size.x > this.#maxSize.x || size.y > this.#maxSize.y))
			throw new Error('Invalid window property value provided - min size must be less than max size');

		this.#minSize = new Vec2(size.x, size.y);
	}
	public setMinSize(w?: number, h?: number) {
		this.minSize = new Vec2(w ?? this.#minSize.x, h ?? this.#minSize.y);
	}

	public get maxSize() {
		return this.#maxSize ? new Vec2(this.#maxSize.x, this.#maxSize.y) : undefined;
	}
	public set maxSize(size: Vec2 | null | undefined) {
		if (size == null) {
			this.#maxSize = undefined;
			return;
		}

		if (!(size instanceof Vec2)) throw new TypeError('Invalid window property value provided - size must be a Vec2');
		if (size.x <= 0 || size.y <= 0)
			throw new Error(
				'Invalid window property value provided - size must be a Vec2 consisting of two positive numbers'
			);

		if (size.x < this.#minSize.x || size.y < this.#minSize.y)
			throw new Error('Invalid window property value provided - max size must be greater than min size');

		this.#maxSize = new Vec2(size.x, size.y);
	}
	public setMaxSize(w?: number, h?: number) {
		const width = w ?? this.#maxSize?.x;
		const height = h ?? this.#maxSize?.y;

		if (!width || !height) {
			this.#maxSize = undefined;
			return;
		}
		if (width < this.#minSize.x || height < this.#minSize.y)
			throw new Error('Invalid window property value provided - max size must be greater than min size');

		this.maxSize = new Vec2(width, height);
	}

	public get position() {
		return new Vec2(this.#position.x, this.#position.y);
	}
	public get initialPosition() {
		return this.#initialPosition === undefined ? undefined : new Vec2(this.#initialPosition.x, this.#initialPosition.y);
	}
	public set position(position: Vec2) {
		if (!(position instanceof Vec2))
			throw new TypeError('Invalid window property value provided - position must be a Vec2');
		this.#position = new Vec2(position.x, position.y);
	}
	public setPosition(w?: number, h?: number) {
		this.#position = new Vec2(w ?? this.#position.x, h ?? this.#position.y);
	}
	public resetPosition() {
		if (this.initialPosition === undefined)
			throw new Error(
				'Position cannot be reset - window has no initial position, possibly because it did not finish initializing'
			);
		this.position = this.initialPosition;
	}
	public captureInitialGeometry() {
		if (this.#initialSize !== undefined || this.#initialPosition !== undefined)
			throw new Error('Initial position or size cannot be set - this window already had its geometry captured');
		this.#initialSize = this.size;
		this.#initialPosition = this.position;
	}

	public get anchor() {
		return new AnchorVec(this.#anchor.x, this.#anchor.y);
	}
	public set anchor(anchor: AnchorVec) {
		this.#anchor = new AnchorVec(anchor.x, anchor.y);
	}
	public setAnchorEnum(x: AnchorPointX, y: AnchorPointY) {
		if (!Util.isEnumValue(AnchorPointX, x) || !Util.isEnumValue(AnchorPointY, y))
			throw new TypeError('Invalid window property value provided - anchors must be valid AnchorPoint enums');
		this.#anchor = new AnchorVec(x, y);
	}

	public get relativePosition() {
		return { x: this.horizontalPositionToAnchor, y: this.verticalPositionToAnchor };
	}
	private get horizontalPositionToAnchor() {
		switch (this.#anchor.x) {
			case AnchorPointX.LEFT:
				return {
					left: this.#position.x,
					center: this.#position.x + this.#size.x / 2,
					right: this.#position.x + this.#size.x
				};
			case AnchorPointX.CENTER:
				return {
					left: this.#position.x - this.#size.x / 2,
					center: this.#position.x,
					right: this.#position.x + this.#size.x / 2
				};
			case AnchorPointX.RIGHT:
				return {
					left: this.#position.x - this.#size.x,
					center: this.#position.x - this.#size.x / 2,
					right: this.#position.x
				};
		}
	}
	private get verticalPositionToAnchor() {
		switch (this.#anchor.y) {
			case AnchorPointY.TOP:
				return {
					top: this.#position.y,
					center: this.#position.y + this.#size.y / 2,
					bottom: this.#position.y + this.#size.y
				};
			case AnchorPointY.CENTER:
				return {
					top: this.#position.y - this.#size.y / 2,
					center: this.#position.y,
					bottom: this.#position.y + this.#size.y / 2
				};
			case AnchorPointY.BOTTOM:
				return {
					top: this.#position.y - this.#size.y,
					center: this.#position.y - this.#size.y / 2,
					bottom: this.#position.y
				};
		}
	}

	public get alwaysOnTop() {
		return this.#alwaysOnTop;
	}
	public set alwaysOnTop(alwaysOnTop: boolean) {
		if (this.#alwaysOnTop === alwaysOnTop) return;
		this.#alwaysOnTop = alwaysOnTop;

		// TODO NOW send event and handle by bringing to top
	}

	public get zIndex() {
		return this.#zIndex;
	}
	public set zIndex(zIndex: number) {
		if (typeof zIndex !== 'number' || isNaN(zIndex))
			throw new TypeError('Invalid window property value provided - zIndex must be a numerical value');

		if (this.#alwaysOnTop && zIndex <= WindowService.TOP_Z_INDEX)
			throw new Error(
				`Invalid window property value provided - always on top zIndex must not be lower or equal ${WindowService.TOP_Z_INDEX}`
			);
		if (!this.#alwaysOnTop && zIndex > WindowService.TOP_Z_INDEX)
			throw new Error(
				`Invalid window property value provided - non-always-on-top zIndex must not be above ${WindowService.TOP_Z_INDEX}`
			);
		if (zIndex < WindowService.BOTTOM_Z_INDEX)
			throw new Error(
				`Invalid window property value provided - zIndex must not be below ${WindowService.BOTTOM_Z_INDEX}`
			);

		if (this.#zIndex === zIndex) return;
		// TODO NOW event and handle by setting z index map
		this.#zIndex = zIndex;
	}

	public get buttons(): readonly WindowButton[] {
		return this.#buttons;
	}
	public set buttons(buttons: WindowButton[]) {
		for (const button of buttons ?? []) this.addButton(button);
	}

	public get editMode() {
		return this.#editMode;
	}
	public setEditMode(mode: WindowEditMode | null) {
		if (mode && this.editMode && mode !== this.editMode) return;
		if (mode === 'moving' && !this.draggable) return;
		if (mode === 'resizing' && !this.resizeable) return;
		if (mode !== 'moving' && this.maximized) return;

		this.#editMode = mode;
	}

	public get content() {
		return this.#content;
	}

	public get parent() {
		return this.#parent;
	}
	public setParent(dWindow?: DisplayWindow<any>) {
		if (!dWindow) return this.removeParent();
		if (this.#parent === dWindow) return;
		if (this.#children.includes(dWindow)) return console.warn(`Attempted to set existing child as parent for ${this}`);
		if (!WindowService.windowExists(dWindow)) return console.warn(`Attempted to set parent for ${this}`);

		dWindow.#children.push(this);
		this.#parent = dWindow;
	}
	public removeParent() {
		if (!this.parent) return console.warn(`Attempted to remove inexistent parent from ${this}`);
		this.parent.removeChildOnly(this);
		this.#parent = undefined;
	}

	public get children(): readonly DisplayWindow<any>[] {
		return this.#children;
	}
	public addChild(dWindow: DisplayWindow<any>) {
		// TODO: Implement hierarchy membership updates
		if (!WindowService.windowExists(dWindow))
			return console.warn(`Attempted to add already orphaned window to ${this}`);
	}
	public addChildren(dWindows: DisplayWindow<any>[]) {
		for (const dWindow of dWindows) this.addChild(dWindow);
	}
	public removeChild(dWindow: DisplayWindow<any>) {
		if (!dWindow) return;
		if (dWindow.parent != this) return console.warn(`Attempted to remove inexistent child from ${this}`);
		dWindow.removeParent();
	}
	public removeChildren(dWindows: DisplayWindow<any>[]) {
		for (const dWindow of dWindows) this.removeChild(dWindow);
	}
	public clearChildren() {
		this.removeChildren(this.#children);
	}
	private removeChildOnly(dWindow: DisplayWindow<any>) {
		this.#children = this.#children.filter((child) => child !== dWindow);
	}

	public close() {
		if (this.#parent) this.removeParent();
		this.clearChildren();
		this.#id = 0;
	}

	public get anchorCss() {
		const x = this.#anchor.x === AnchorPointX.CENTER ? 'left: calc(50% - var(--w) / 2)' : `${this.#anchor.x}: 0`;
		const y = this.#anchor.y === AnchorPointY.CENTER ? 'top: calc(50% - var(--h) / 2)' : `${this.#anchor.y}: 0`;

		return `${x}; ${y};`;
	}

	public get positioningCss() {
		if (this.maximized) return 'transform: translate3d(0, 0, 0);';

		const x = `${this.#position.x}px`;
		const y = `${this.#position.y}px`;
		const translate = `translate3d(${x}, ${y}, 0)`;

		return `${this.anchorCss} --x: ${x}; --y: ${y}; transform: ${translate};`;
	}

	// more rules in windows.css
	public get widthCss() {
		return `--w: ${this.#size.x}px;`;
	}
	public get heightCss() {
		return `--h: ${this.#size.y}px;`;
	}

	public get windowContainerCss() {
		return `${this.positioningCss}
		${this.widthCss}
		${this.heightCss}
    --border-radius: ${this.layout.borderRadius}px;
    --z-index: ${this.zIndex};
    ${this.customWindowContainerCss}`;
	}
	public get contentContainerCss() {
		const overflow = this.#size.x < 72 || this.#size.y < 72 ? 'overflow: hidden;' : '';
		return `${overflow}
    --padding: ${this.layout.padding}px;
    ${this.customContentContainerCss}`;
	}

	public setButtons(buttons: WindowButton[]) {
		this.#buttons = [];
		for (const button of buttons) this.addButton(button);
	}

	public addButton(button: WindowButton) {
		this.#buttons.push(button.clone());
	}

	public matchesPredicates(predicates: Partial<{ [K in keyof this]: this[K] }>, mode: PredicateMode) {
		for (const property in predicates) {
			if (this[property] == predicates[property]) {
				if (mode === PredicateMode.ANY) return true;
			} else if (mode === PredicateMode.ALL) {
				return false;
			}
		}

		return mode === PredicateMode.ALL;
	}

	public toString() {
		return `Window [#${this.#id},${this.tag === undefined ? '' : ` TAG: "${this.tag}"`} CLASS: "${this.objectClass}"] (z: ${this.zIndex}) - "${this.title}"`;
	}
}
