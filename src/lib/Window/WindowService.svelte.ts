import type { Snippet } from 'svelte';
import { readonly, writable, type Readable } from 'svelte/store';
import { EventService } from '../Event/EventService';
import { PredicateMode } from '../Util/PredicateMode';
import { Quadrant } from '../Util/Quadrant';
import { Vec2 } from '../Util/Vec2';
import { AnchorPointX } from './AnchorPointX';
import { AnchorPointY } from './AnchorPointY';
import type { AnchorVec } from './AnchorVec';
import { WindowButton } from './Button/WindowButton.svelte';
import { DisplayWindow, type WindowEditMode } from './DisplayWindow.svelte';
import type { WindowLayout } from './WindowLayout.svelte';
import { WindowLayoutBuilder } from './WindowLayoutBuilder';

type ManagedWindow = DisplayWindow<any>;

type EditingWindow = {
	dWindow: ManagedWindow;
	offset: Vec2;
	mode: WindowEditMode;
};

export type CreateWindowParams<P extends object = Record<string, unknown>> = {
	content: Snippet<[P | undefined]>;
	tag?: string;
	props?: P;
	title?: string;
	objectClass?: string;
	layout?: WindowLayout;
	minimizable?: boolean;
	maximizable?: boolean;
	resizeable?: boolean;
	draggable?: boolean;
	alwaysOnTop?: boolean;
	focused?: boolean;
	minimized?: boolean;
	maximized?: boolean;
	backdropVisible?: boolean;
	customWindowContainerCss?: string;
	customContentContainerCss?: string;
	position?: Vec2;
	size?: Vec2;
	minSize?: Vec2;
	maxSize?: Vec2;
	anchor?: AnchorVec;
	buttons?: WindowButton[];
	parent?: ManagedWindow;
	children?: ManagedWindow[];
};

export class WindowService {
	static readonly MAX_WINDOWS = 128;
	static readonly DEFAULT_Z_INDEX = 3;
	static readonly TOP_Z_INDEX = WindowService.DEFAULT_Z_INDEX + WindowService.MAX_WINDOWS + 3;

	readonly #windows = new Map<number, ManagedWindow>();
	readonly #windowsByTag = new Map<string, ManagedWindow>();
	readonly #windowsStore = writable<readonly ManagedWindow[]>(Object.freeze([]));
	readonly #windowsReadable: Readable<readonly ManagedWindow[]> = readonly(this.#windowsStore);
	readonly #windowsOnTop = new Set<number>();
	readonly #windowsByZIndex = new Map<number, number>();
	#container: HTMLElement | undefined;
	#focusedWindow: ManagedWindow | null = null;
	#editingWindow: EditingWindow | null = null;
	#pendingDragEvent: MouseEvent | null = null;
	#dragAnimationFrame: number | null = null;
	#windowIdSequence = 1;
	readonly #unsubscribeClose: () => void;
	#disposed = false;

	public constructor(container?: HTMLElement) {
		this.#unsubscribeClose = EventService.windowCloseEvent.subscribe(
			(event) =>
				event && [...this.#windows.values()].includes(event.sourceWindow) && this.closeWindow(event.sourceWindow)
		);

		if (container) this.initialize(container);
	}

	public static windowExists(dWindow?: ManagedWindow) {
		return !!dWindow?.id;
	}

	public get windows() {
		return this.#windowsReadable;
	}

	public get focusedWindow() {
		return this.#focusedWindow;
	}
	public get editingWindow() {
		return this.#editingWindow;
	}

	private get topZIndex() {
		return this.#windowsByZIndex.size ? Math.max(...this.#windowsByZIndex.keys()) : WindowService.DEFAULT_Z_INDEX;
	}
	// @ts-expect-error unused atm
	private get bottomZIndex() {
		return this.#windowsByZIndex.size ? Math.min(...this.#windowsByZIndex.keys()) : WindowService.DEFAULT_Z_INDEX;
	}

	public get containerSize() {
		if (!this.isInitialized) throw new Error('Cannot perform this action on an uninitialized WindowService');

		const { width, height } = this.#container!.getBoundingClientRect();
		return new Vec2(width, height);
	}
	public get containerPosition() {
		if (!this.isInitialized) throw new Error('Cannot perform this action on an uninitialized WindowService');

		const { x, y } = this.#container!.getBoundingClientRect();
		return new Vec2(x, y);
	}

	// TODO?: disallow registering windows until initialized
	public get isInitialized() {
		return this.#container !== undefined;
	}

	public initialize(container: HTMLElement) {
		if (!container) throw new Error('Cannot initialize WindowService without a container HTML element');
		this.#container = container;
	}

	public getWindowAnchorPosition(dWindow: ManagedWindow) {
		if (!this.isInitialized) throw new Error('Cannot perform this action on an uninitialized WindowService');

		const containerRect = this.#container!.getBoundingClientRect();
		let x = 0;
		if (dWindow.anchor.x === AnchorPointX.CENTER) x = containerRect.width / 2;
		else if (dWindow.anchor.x === AnchorPointX.RIGHT) x = containerRect.width;

		let y = 0;
		if (dWindow.anchor.y === AnchorPointY.CENTER) y = containerRect.height / 2;
		else if (dWindow.anchor.y === AnchorPointY.BOTTOM) y = containerRect.height;

		return new Vec2(x, y);
	}

	public getWindowTopLeftPosition(dWindow: ManagedWindow) {
		if (!this.isInitialized) throw new Error('Cannot perform this action on an uninitialized WindowService');

		const anchorPosition = this.getWindowAnchorPosition(dWindow);
		const windowRelativePosition = dWindow.relativePosition;
		return new Vec2(anchorPosition.x + windowRelativePosition.x.left, anchorPosition.y + windowRelativePosition.y.top);
	}

	public translatePointToContainerCoordinates(pagePoint: Vec2) {
		if (!this.isInitialized) throw new Error('Cannot perform this action on an uninitialized WindowService');

		const containerRect = this.#container!.getBoundingClientRect();
		return new Vec2(pagePoint.x - containerRect.x, pagePoint.y - containerRect.y);
	}

	public translatePointToWindowCoordinates(dWindow: ManagedWindow, viewportPoint: Vec2) {
		if (!this.isInitialized) throw new Error('Cannot perform this action on an uninitialized WindowService');

		const containerCoordinates = this.translatePointToContainerCoordinates(viewportPoint);
		const windowPos = this.getWindowTopLeftPosition(dWindow);
		return new Vec2(containerCoordinates.x - windowPos.x, containerCoordinates.y - windowPos.y);
	}

	public getPointWindowQuadrant(dWindow: ManagedWindow, viewportPoint: Vec2) {
		if (!this.isInitialized) throw new Error('Cannot perform this action on an uninitialized WindowService');

		const windowPoint = this.translatePointToWindowCoordinates(dWindow, viewportPoint);
		const windowSize = dWindow.size;
		const halfW = windowSize.x / 2;
		const halfH = windowSize.y / 2;

		if (windowPoint.x >= halfW) return windowPoint.y >= halfH ? Quadrant.BOTTOM_RIGHT : Quadrant.TOP_RIGHT;
		return windowPoint.y >= halfH ? Quadrant.BOTTOM_LEFT : Quadrant.TOP_LEFT;
	}

	public getWindowById(id: number) {
		return this.#windows.get(id);
	}

	public getWindowByTag(tag: string) {
		return this.#windowsByTag.get(tag);
	}

	public getWindowByZIndex(zIndex: number) {
		const id = this.#windowsByZIndex.get(zIndex);
		return id ? this.getWindowById(id) : undefined;
	}

	public getWindowsByPredicates<T extends ManagedWindow>(
		predicates: Partial<{ [K in keyof T]: T[K] }>,
		mode = PredicateMode.ALL
	) {
		const windows: ManagedWindow[] = [];
		for (const [_, dWindow] of this.#windows) {
			if (dWindow.matchesPredicates(predicates, mode)) windows.push(dWindow);
		}
		return windows;
	}

	public getWindowsByClass(windowClass: string) {
		return this.getWindowsByPredicates({ objectClass: windowClass }, PredicateMode.ANY);
	}

	public getWindowsByTitle(title: string) {
		return this.getWindowsByPredicates({ title }, PredicateMode.ANY);
	}

	public getFirstWindowByTitle(title: string) {
		for (const [_, dWindow] of this.#windows) {
			if (dWindow.title === title) return dWindow;
		}
		return;
	}

	public debugAllObjects() {
		let debugString = '';
		for (const [i, dWindow] of this.#windows) debugString += i + '\t' + dWindow.toString() + '\n';
		console.log(debugString);
	}

	public handleClose(_: Event, dWindow: ManagedWindow) {
		return this.closeWindow(dWindow);
	}

	public closeWindow(dWindow: ManagedWindow) {
		if (this.#windows.get(dWindow.id) !== dWindow) return false;
		if (this.#focusedWindow?.id === dWindow.id) this.#focusedWindow = null;
		if (dWindow.alwaysOnTop) this.#windowsOnTop.delete(dWindow.id);
		if (this.#editingWindow?.dWindow === dWindow) {
			this.cancelPendingDragUpdate();
			dWindow.setEditMode(null);
			this.#editingWindow = null;
		}

		this.#windowsByZIndex.delete(dWindow.zIndex);
		this.removeWindowsMap(dWindow);
		dWindow.close();
		return true;
	}

	public handleMinimize(_: Event, dWindow: ManagedWindow) {
		this.toggleMinimizeWindow(dWindow);
	}

	public handleMaximize(_: Event, dWindow: ManagedWindow) {
		this.toggleMaximizeWindow(dWindow);
	}

	public toggleMaximizeWindow(dWindow: ManagedWindow) {
		dWindow.maximized = !dWindow.maximized;
	}

	public toggleMinimizeWindow(dWindow: ManagedWindow) {
		dWindow.minimized = !dWindow.minimized;
	}

	public handleDragStart(e: MouseEvent, dWindow: ManagedWindow, mode: WindowEditMode) {
		// TODO: handle anchors after split to anchor X & Y
		if (mode === 'moving')
			return (this.#editingWindow = {
				dWindow,
				mode,
				offset: new Vec2(dWindow.position.x - e.clientX, dWindow.position.y - e.clientY)
			});

		// TODO!: resize anchors based on quadrant
		const quadrant = this.getPointWindowQuadrant(dWindow, new Vec2(e.clientX, e.clientY));
		dWindow.element!.ownerDocument.body.setAttribute('data-resize-direction', quadrant);
		return (this.#editingWindow = {
			dWindow,
			mode,
			offset: new Vec2(dWindow.size.x - e.clientX, dWindow.size.y - e.clientY)
		});
	}

	public handleDragEnd(_: MouseEvent) {
		if (!this.#editingWindow?.dWindow) return;

		this.applyPendingDragUpdate();
		this.#editingWindow.dWindow.setEditMode(null);
		this.#editingWindow.dWindow.element!.ownerDocument.body.removeAttribute('data-resize-direction');
		this.#editingWindow = null;
	}

	public handleDrag(e: MouseEvent) {
		if (!this.#editingWindow?.dWindow) return;
		this.#pendingDragEvent = e;
		if (this.#dragAnimationFrame !== null) return;

		this.#dragAnimationFrame = requestAnimationFrame(() => {
			this.#dragAnimationFrame = null;
			this.applyPendingDragUpdate();
		});
	}

	private applyPendingDragUpdate() {
		if (this.#dragAnimationFrame !== null) {
			cancelAnimationFrame(this.#dragAnimationFrame);
			this.#dragAnimationFrame = null;
		}

		if (this.#pendingDragEvent) this.applyDragUpdate(this.#pendingDragEvent);
		this.#pendingDragEvent = null;
	}

	private applyDragUpdate(e: MouseEvent) {
		const editingWindow = this.#editingWindow;
		if (!editingWindow?.dWindow) return;
		const dWindow = editingWindow.dWindow;

		if (editingWindow.mode === 'moving') {
			dWindow.setPosition(e.clientX + editingWindow.offset.x, e.clientY + editingWindow.offset.y);
		} else {
			// TODO: handle anchors after split to anchor X & Y
			dWindow.setSize(e.clientX + editingWindow.offset.x, e.clientY + editingWindow.offset.y);
		}
		this.constrainTitleBarToContainer(dWindow);
	}

	// this does not constrain resizeable windows without titlebars!
	// TODO!: minimizing may put bottom anchor windows below container
	private constrainTitleBarToContainer(dWindow: ManagedWindow) {
		const titleBar = dWindow.element?.querySelector<HTMLElement>('.display-window-titlebar');
		if (!titleBar) return;

		const containerSize = this.containerSize;
		if (dWindow.size.x > containerSize.x && dWindow.minSize.x <= containerSize.x)
			dWindow.setSize(containerSize.x, dWindow.size.y);

		const titleBarHeight = titleBar.getBoundingClientRect().height;
		const topLeft = this.getWindowTopLeftPosition(dWindow);
		if (dWindow.anchor.y === AnchorPointY.BOTTOM) topLeft.y -= titleBarHeight;

		const left = Math.min(Math.max(topLeft.x, 0), Math.max(0, containerSize.x - dWindow.size.x));
		const top = Math.min(Math.max(topLeft.y, 0), Math.max(0, containerSize.y - titleBarHeight));
		if (left !== topLeft.x || top !== topLeft.y) {
			const position = dWindow.position;
			dWindow.setPosition(position.x + left - topLeft.x, position.y + top - topLeft.y);
		}
	}

	private cancelPendingDragUpdate() {
		console.debug('cancelPendingDragUpdate');
		this.#pendingDragEvent = null;
		if (this.#dragAnimationFrame !== null) {
			cancelAnimationFrame(this.#dragAnimationFrame);
			this.#dragAnimationFrame = null;
		}
	}

	public handleFocus(_: FocusEvent, dWindow: ManagedWindow) {
		this.focusWindow(dWindow);
	}
	public handleBlur(_: FocusEvent, __: ManagedWindow) {
		this.unfocusWindow();
	}

	public focusWindow(dWindow: ManagedWindow) {
		if (this.#focusedWindow == dWindow) return;
		this.unfocusWindow();

		dWindow.focused = true;
		this.#focusedWindow = dWindow;
		// TODO
		this.setFocusedWindowZIndex(dWindow);
	}

	public unfocusWindow() {
		if (!this.#focusedWindow) return;

		this.#focusedWindow.focused = false;
		this.#focusedWindow = null;
	}

	public static isNodeDisplayWindow(node: EventTarget) {
		return node instanceof HTMLElement && node.nodeName === 'DIV' && node.hasAttribute('data-window-class');
	}

	public createWindow<P extends object = Record<string, unknown>>(
		options: CreateWindowParams<P>
	): DisplayWindow<P> | undefined {
		const dWindow = new DisplayWindow<P>(this.determineNewWindowId(), options.content, options.tag);

		if (options.title) dWindow.title = options.title;
		if (options.objectClass) dWindow.objectClass = options.objectClass;
		if (options.position) dWindow.position = options.position;
		if (options.minimizable != null) dWindow.minimizable = options.minimizable;
		if (options.maximizable != null) dWindow.maximizable = options.maximizable;
		if (options.resizeable != null) dWindow.resizeable = options.resizeable;
		if (options.draggable != null) dWindow.draggable = options.draggable;
		if (options.alwaysOnTop != null) dWindow.alwaysOnTop = options.alwaysOnTop;
		if (options.focused != null) dWindow.focused = options.focused;
		if (options.minimized != null) dWindow.minimized = options.minimized;
		if (options.maximized != null) dWindow.maximized = options.maximized;
		if (options.backdropVisible != null) dWindow.backdropVisible = options.backdropVisible;
		if (options.customWindowContainerCss) dWindow.customWindowContainerCss = options.customWindowContainerCss;
		if (options.customContentContainerCss) dWindow.customContentContainerCss = options.customContentContainerCss;
		if (options.props != null) dWindow.props = options.props;
		if (options.size) dWindow.size = options.size;
		if (options.minSize) dWindow.minSize = options.minSize;
		if (options.maxSize) dWindow.maxSize = options.maxSize;
		if (options.anchor) dWindow.anchor = options.anchor;
		if (options.buttons) dWindow.buttons = options.buttons;
		if (options.parent != null) dWindow.setParent(options.parent);
		if (options.children?.length) dWindow.addChildren(options.children);
		dWindow.layout = options.layout ? options.layout : this.generateDefaultWindowLayout(dWindow);

		this.registerWindow(dWindow);
		return dWindow;
	}

	public createClassWindow<T extends ManagedWindow>(dWindow: T): T | undefined {
		dWindow.id = this.determineNewWindowId();
		this.registerWindow(dWindow);
		return dWindow;
	}

	private registerWindow(dWindow: ManagedWindow) {
		if (this.#disposed)
			throw new Error('Failed to register window: cannot perform any action with a disposed WindowService');
		if (this.#windows.size >= WindowService.MAX_WINDOWS)
			throw new Error(`Failed to register window: maximum number of windows is ${WindowService.MAX_WINDOWS}`);
		if (dWindow.tag !== undefined && this.#windowsByTag.has(dWindow.tag))
			throw new Error(`Failed to register window: tag "${dWindow.tag}" is already in use`);

		if (dWindow.focused) this.focusWindow(dWindow);
		if (dWindow.alwaysOnTop) this.#windowsOnTop.add(dWindow.id);
		this.setWindowsMap(dWindow);
	}

	private generateDefaultWindowLayout(dWindow: ManagedWindow) {
		return new WindowLayoutBuilder()
			.withMaximizeButton(dWindow.maximizable)
			.withMinimizeButton(dWindow.minimizable)
			.withTitle(!!dWindow.title)
			.build();
	}

	private setWindowsMap(dWindow: ManagedWindow) {
		this.#windows.set(dWindow.id, dWindow);
		if (dWindow.tag !== undefined) this.#windowsByTag.set(dWindow.tag, dWindow);
		this.publishWindowMembership();
	}

	private removeWindowsMap(dWindow: ManagedWindow) {
		if (this.#windows.get(dWindow.id) !== dWindow) return;
		this.#windows.delete(dWindow.id);
		if (dWindow.tag !== undefined && this.#windowsByTag.get(dWindow.tag) === dWindow)
			this.#windowsByTag.delete(dWindow.tag);
		this.publishWindowMembership();
	}

	private publishWindowMembership() {
		this.#windowsStore.set(Object.freeze([...this.#windows.values()]));
	}

	public dispose() {
		if (this.#disposed) return;

		this.#disposed = true;
		this.#unsubscribeClose();
		this.cancelPendingDragUpdate();
		if (this.#editingWindow) this.#editingWindow.dWindow.setEditMode(null);
		this.#editingWindow = null;

		//TODO?: close & remove all windows
	}

	private setFocusedWindowZIndex(dWindow: ManagedWindow) {
		// TODO
		// if (dWindow.alwaysOnTop) {
		// for(const i of this.#windowsOnTop) {
		//   const tWindow = this.#windows.get(i);
		//   const newZIndex = tWindow!.zIndex - 1;
		//   this.#windowsByZIndex.get(newZIndex);
		// if true then recursion... TODO move down 1 z-index method
		// }
		// }

		const zIndex = dWindow.alwaysOnTop ? WindowService.TOP_Z_INDEX + 1 : this.topZIndex + 1;
		dWindow.zIndex = zIndex;
		this.#windowsByZIndex.set(zIndex, dWindow.id);
	}

	private determineNewWindowId() {
		return this.#windowIdSequence++;
	}
}
