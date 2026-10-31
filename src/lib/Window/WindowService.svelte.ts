import type { Snippet } from 'svelte';
import { readonly, writable, type Readable } from 'svelte/store';
import { EventService } from '../Event/EventService';
import { WindowAlwaysOnTopChangeEvent } from '../Event/WindowAlwaysOnTopChangeEvent';
import { WindowCloseEvent } from '../Event/WindowCloseEvent';
import { WindowZIndexChangeEvent } from '../Event/WindowZIndexChangeEvent';
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
	transitionDurationMultiplier?: number;
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
	static readonly BOTTOM_Z_INDEX = 3;
	static readonly TOP_Z_INDEX = WindowService.BOTTOM_Z_INDEX * 3 + WindowService.MAX_WINDOWS; // highest normal window z-index, always on top windows start from this index + 1

	readonly #windowsById = new Map<number, ManagedWindow>();
	readonly #windowsByTag = new Map<string, ManagedWindow>();
	readonly #windowsByZIndex = new Map<number, ManagedWindow[]>();
	readonly #windowsStore = writable<readonly ManagedWindow[]>(Object.freeze([]));
	readonly #windowsReadable: Readable<readonly ManagedWindow[]> = readonly(this.#windowsStore);
	#container: HTMLElement | undefined;
	#focusedWindow = $state<ManagedWindow | null>(null);
	#editingWindow = $state<EditingWindow | null>(null);
	#pendingDragEvent: MouseEvent | null = null;
	#dragAnimationFrame: number | null = null;
	#windowIdSequence = 1;
	#disposed = false;
	readonly #unsubscribeClose: () => void;
	readonly #unsubscribeAlwaysOnTop: () => void;
	readonly #unsubscribeZIndex: () => void;

	public static isNodeDisplayWindow(node: EventTarget | HTMLElement) {
		return (
			node instanceof HTMLElement &&
			node.nodeName === 'DIV' &&
			node.hasAttribute('data-window-state') &&
			node.classList.contains('display-window-container')
		);
	}

	public constructor(container?: HTMLElement) {
		// TODO?: some kind of event ownership token so that every window service instance doesnt need to validate window identity? probably fine for my intended target of 3 simultaneous instances idk
		this.#unsubscribeClose = EventService.on(WindowCloseEvent, (event) => {
			if (this.#windowsById.get(event.sourceWindow.id) === event.sourceWindow) this.closeWindow(event.sourceWindow);
		});
		this.#unsubscribeAlwaysOnTop = EventService.on(WindowAlwaysOnTopChangeEvent, (event) => {
			if (this.#windowsById.get(event.sourceWindow.id) === event.sourceWindow) this.bringToTop(event.sourceWindow);
		});
		this.#unsubscribeZIndex = EventService.on(WindowZIndexChangeEvent, (event) => {
			if (this.#windowsById.get(event.sourceWindow.id) !== event.sourceWindow) return;

			this.removeWindowFromZMap(event.sourceWindow, event.oldZIndex);
			this.addWindowToZMap(event.sourceWindow, event.newZIndex);
		});

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
	public isFocused(dWindow: ManagedWindow) {
		return this.#focusedWindow === dWindow;
	}
	public get editingWindow() {
		return this.#editingWindow;
	}

	// normal (non-always-on-top) windows only
	public get highestOccupiedZIndex() {
		for (let i = WindowService.TOP_Z_INDEX; i >= WindowService.BOTTOM_Z_INDEX; --i) {
			if (this.#windowsByZIndex.get(i)?.length) return i;
		}

		return null;
	}
	public get highestUnoccupiedZIndex() {
		for (let i = WindowService.TOP_Z_INDEX; i >= WindowService.BOTTOM_Z_INDEX; --i) {
			if (!this.#windowsByZIndex.get(i)?.length) return i;
		}

		throw new Error(
			'Invalid state - all normal (non-always-on-top) z-indexes are allocated - were the static WindowService fields tampered with?'
		);
	}
	public get lowestOccupiedZIndex() {
		for (let i = WindowService.BOTTOM_Z_INDEX; i <= WindowService.TOP_Z_INDEX; ++i) {
			if (this.#windowsByZIndex.get(i)?.length) return i;
		}

		return null;
	}
	public get lowestUnoccupiedZIndex() {
		for (let i = WindowService.BOTTOM_Z_INDEX; i <= WindowService.TOP_Z_INDEX; ++i) {
			if (!this.#windowsByZIndex.get(i)?.length) return i;
		}

		throw new Error(
			'Invalid state - all normal (non-always-on-top) z-indexes are allocated - were the static WindowService fields tampered with?'
		);
	}

	public get highestOccupiedAlwaysOnTopZIndex() {
		let max: number | null = null;
		for (const i of this.#windowsByZIndex.keys()) {
			if (i > WindowService.TOP_Z_INDEX && (max === null || i > max)) max = i;
		}

		return max;
	}
	public get lowestOccupiedAlwaysOnTopZIndex() {
		let min: number | null = null;
		for (const i of this.#windowsByZIndex.keys()) {
			if (i > WindowService.TOP_Z_INDEX && (min === null || i < min)) min = i;
		}

		return min;
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
		return this.#windowsById.get(id);
	}
	public getWindowsByIds(ids: number[]) {
		const map = new Map<number, ManagedWindow | undefined>();
		for (const id of ids) map.set(id, this.getWindowById(id));

		return map;
	}
	public getWindowByTag(tag: string) {
		return this.#windowsByTag.get(tag);
	}
	public getWindowsByClass(windowClass: string) {
		return this.getWindowsByPredicates({ objectClass: windowClass }, PredicateMode.ANY);
	}
	public getWindowsByZIndex(zIndex: number) {
		return this.#windowsByZIndex.get(zIndex) ?? [];
	}

	// Should be avoided - use tags, ids, classes, or keep references instead
	public getWindowsByTitle(title: string) {
		return this.getWindowsByPredicates({ title }, PredicateMode.ANY);
	}
	// Should be avoided - use tags, ids, classes, or keep references instead
	public getFirstWindowByTitle(title: string) {
		for (const [_, dWindow] of this.#windowsById) {
			if (dWindow.title === title) return dWindow;
		}
		return;
	}

	public getWindowsByPredicates<T extends ManagedWindow>(
		predicates: Partial<{ [K in keyof T]: T[K] }>,
		mode = PredicateMode.ALL
	) {
		const windows: ManagedWindow[] = [];
		for (const [_, dWindow] of this.#windowsById) {
			if (dWindow.matchesPredicates(predicates, mode)) windows.push(dWindow);
		}
		return windows;
	}

	public debugAllObjects() {
		let debugString = '';
		for (const [i, dWindow] of this.#windowsById) debugString += i + '\t' + dWindow.toString() + '\n';
		console.log(debugString);
	}

	public debugAllWindowMaps() {
		console.log('Windows by id');
		console.table([...this.#windowsById].map(([id, dWindow]) => ({ id, window: dWindow.toString() })));

		console.log('Windows by tag');
		console.table([...this.#windowsByTag].map(([tag, dWindow]) => ({ tag, window: dWindow.toString() })));

		console.log('Windows by z-index');
		console.table(
			[...this.#windowsByZIndex].map(([zIndex, windows]) => ({
				zIndex,
				windows: windows.map((dWindow) => dWindow.toString())
			}))
		);
	}

	public handleClose(_: Event, dWindow: ManagedWindow) {
		return this.closeWindow(dWindow);
	}

	public closeWindow(dWindow: ManagedWindow) {
		if (this.#windowsById.get(dWindow.id) !== dWindow) return false;
		if (this.#focusedWindow?.id === dWindow.id) this.#focusedWindow = null;
		if (this.#editingWindow?.dWindow === dWindow) {
			this.cancelPendingDragUpdate();
			dWindow.setEditMode(null);
			this.#editingWindow = null;
		}

		this.removeWindowFromMaps(dWindow);
		dWindow.close();
		return true;
	}

	public closeAllWindows() {
		this.cancelPendingDragUpdate();
		if (this.#editingWindow) this.#editingWindow.dWindow.setEditMode(null);
		this.#editingWindow = null;
		this.#focusedWindow = null;

		for (const dWindow of this.#windowsById.values()) dWindow.close();
		this.#windowsById.clear();
		this.#windowsByTag.clear();
		this.#windowsByZIndex.clear();
		this.publishWindowMembership();
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

	public setAllWindowsReducedMotion(reducedMotion: boolean) {
		const multiplier = reducedMotion ? 0 : 1;
		for (const dWindow of this.#windowsById.values()) dWindow.transitionDurationMultiplier = multiplier;
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
		this.blurWindow();
	}

	public focusWindow(dWindow: ManagedWindow) {
		if (this.#focusedWindow === dWindow) return;
		this.blurWindow();

		this.#focusedWindow = dWindow;
		this.bringToTop(dWindow);
	}

	public blurWindow() {
		this.#focusedWindow = null;
	}

	public dispose() {
		if (this.#disposed) return;

		this.#disposed = true;
		this.#unsubscribeClose();
		this.#unsubscribeAlwaysOnTop();
		this.#unsubscribeZIndex();
		this.closeAllWindows();
	}

	public bringToTop(dWindow: ManagedWindow) {
		if (dWindow.alwaysOnTop) {
			dWindow.zIndex = (this.highestOccupiedAlwaysOnTopZIndex ?? WindowService.TOP_Z_INDEX) + 1;
			return;
		}

		let newIndex = this.highestOccupiedZIndex ?? WindowService.BOTTOM_Z_INDEX;
		if (newIndex >= WindowService.TOP_Z_INDEX)
			this.moveWindowsBetweenZIndexes(WindowService.TOP_Z_INDEX, WindowService.TOP_Z_INDEX - 1, [dWindow]);
		else ++newIndex;

		dWindow.zIndex = newIndex;
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
		if (options.minimized != null) dWindow.minimized = options.minimized;
		if (options.maximized != null) dWindow.maximized = options.maximized;
		if (options.backdropVisible != null) dWindow.backdropVisible = options.backdropVisible;
		if (options.transitionDurationMultiplier != null)
			dWindow.transitionDurationMultiplier = options.transitionDurationMultiplier;
		if (options.customWindowContainerCss) dWindow.customWindowContainerCss = options.customWindowContainerCss;
		if (options.customContentContainerCss) dWindow.customContentContainerCss = options.customContentContainerCss;
		if (options.props != null) dWindow.props = options.props;
		if (options.minSize) dWindow.minSize = options.minSize;
		if (options.maxSize) dWindow.maxSize = options.maxSize;
		if (options.size) dWindow.size = options.size;
		if (options.anchor) dWindow.anchor = options.anchor;
		if (options.buttons) dWindow.buttons = options.buttons;
		if (options.parent != null) dWindow.setParent(options.parent);
		if (options.children?.length) dWindow.addChildren(options.children);
		dWindow.layout = options.layout ? options.layout : this.buildDefaultWindowLayout(dWindow);

		this.registerWindow(dWindow, options.focused);
		return dWindow;
	}

	public createClassWindow<T extends ManagedWindow>(dWindow: T): T | undefined {
		dWindow.id = this.determineNewWindowId();
		this.registerWindow(dWindow);
		return dWindow;
	}

	private registerWindow(dWindow: ManagedWindow, focused = true) {
		if (this.#disposed)
			throw new Error('Failed to register window: cannot perform any action with a disposed WindowService');
		if (this.#windowsById.size >= WindowService.MAX_WINDOWS)
			throw new Error(`Failed to register window: maximum number of windows is ${WindowService.MAX_WINDOWS}`);
		if (dWindow.tag !== undefined && this.#windowsByTag.has(dWindow.tag))
			throw new Error(
				`Failed to register window: tag "${dWindow.tag}" is already in use - this is most probably intended behavior`
			);

		this.#windowsById.set(dWindow.id, dWindow); // workaround for focused window z-index shenanigans
		dWindow.captureInitialGeometry();
		if (focused) this.focusWindow(dWindow);
		else if (dWindow.alwaysOnTop) this.bringToTop(dWindow);
		this.addWindowToMaps(dWindow);
	}

	private buildDefaultWindowLayout(dWindow: ManagedWindow) {
		return new WindowLayoutBuilder()
			.withMaximizeButton(dWindow.maximizable)
			.withMinimizeButton(dWindow.minimizable)
			.withTitle(!!dWindow.title)
			.build();
	}

	// TODO?: Could be optimized by adding a bulk change event
	private moveWindowsBetweenZIndexes(
		sourceIndex: number,
		destinationIndex: number,
		ignoredWindows: ManagedWindow[] = []
	) {
		if (sourceIndex === destinationIndex) return;

		const windows = (this.#windowsByZIndex.get(sourceIndex) ?? []).filter((w) => !ignoredWindows.includes(w));
		for (const w of windows) w.zIndex = destinationIndex;
	}

	private addWindowToMaps(dWindow: ManagedWindow) {
		if (dWindow.tag !== undefined) this.#windowsByTag.set(dWindow.tag, dWindow);
		if (!this.isFocused(dWindow)) this.addWindowToZMap(dWindow);

		this.publishWindowMembership();
	}

	private removeWindowFromMaps(dWindow: ManagedWindow) {
		this.#windowsById.delete(dWindow.id);
		if (dWindow.tag !== undefined && this.#windowsByTag.get(dWindow.tag) === dWindow)
			this.#windowsByTag.delete(dWindow.tag);
		this.removeWindowFromZMap(dWindow);

		this.publishWindowMembership();
	}

	private addWindowToZMap(dWindow: ManagedWindow, zIndex = dWindow.zIndex) {
		this.#windowsByZIndex.set(zIndex, [...(this.#windowsByZIndex.get(zIndex) ?? []), dWindow]);
	}
	private removeWindowFromZMap(dWindow: ManagedWindow, zIndex = dWindow.zIndex) {
		this.#windowsByZIndex.set(
			zIndex,
			(this.#windowsByZIndex.get(zIndex) ?? []).filter((w) => w !== dWindow)
		);
	}

	private publishWindowMembership() {
		this.#windowsStore.set(Object.freeze([...this.#windowsById.values()]));
	}

	private determineNewWindowId() {
		if (this.#disposed) return 0;
		return this.#windowIdSequence++;
	}
}
