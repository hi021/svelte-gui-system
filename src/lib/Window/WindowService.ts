import type { Snippet } from 'svelte';
import { readonly, writable, type Readable } from 'svelte/store';
import { EventService } from '../Event/EventService';
import { PredicateMode } from '../Util/PredicateMode';
import { Vec2 } from '../Util/Vec2';
import { AnchorPoint } from './AnchorPoint';
import { WindowButton } from './Button/WindowButton.svelte';
import { DisplayWindow, type WindowEditMode } from './DisplayWindow.svelte';
import { WindowLayout } from './WindowLayout.svelte';

type ManagedWindow = DisplayWindow<any>;

type EditingWindow = {
	dWindow: ManagedWindow;
	offset: Vec2;
	mode: WindowEditMode;
};

export type CreateWindowParams<P extends object = Record<string, unknown>> = {
	content: Snippet<[P | undefined]>;
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
	anchor?: AnchorPoint;
	buttons?: WindowButton[];
	parent?: ManagedWindow;
	children?: ManagedWindow[];
};

export class WindowService {
	static readonly MAX_WINDOWS = 128;
	static readonly DEFAULT_Z_INDEX = 3;
	static readonly TOP_Z_INDEX = WindowService.DEFAULT_Z_INDEX + WindowService.MAX_WINDOWS + 3;

	readonly #windows = new Map<number, ManagedWindow>();
	readonly #windowsStore = writable<readonly ManagedWindow[]>(Object.freeze([]));
	readonly #windowsReadable: Readable<readonly ManagedWindow[]> = readonly(this.#windowsStore);
	#windowsOnTop = new Set<number>();
	readonly #windowsByZIndex = new Map<number, number>();
	#focusedWindow: ManagedWindow | null = null;
	#editingWindow: EditingWindow | null = null;
	#windowIdSequence = 1;
	#unsubscribeClose: () => void;
	#disposed = false;

	public constructor() {
		this.#unsubscribeClose = EventService.windowCloseEvent.subscribe(
			(event) =>
				event && [...this.#windows.values()].includes(event.sourceWindow) && this.closeWindow(event.sourceWindow)
		);
	}

	public static windowExists(dWindow?: ManagedWindow) {
		return !!dWindow?.id;
	}

	public get windows(): Readable<readonly ManagedWindow[]> {
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
	private get bottomZIndex() {
		return this.#windowsByZIndex.size ? Math.min(...this.#windowsByZIndex.keys()) : WindowService.DEFAULT_Z_INDEX;
	}

	public getWindowById(id: number) {
		return this.#windows.get(id);
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
	}

	public debugAllObjects() {
		let debugString = '';
		for (const [i, dWindow] of this.#windows) debugString += i + '\t' + dWindow.toString() + '\n';
		console.log(debugString);
	}

	public handleClose(e: Event, dWindow: ManagedWindow) {
		return this.closeWindow(dWindow);
	}

	public closeWindow(dWindow: ManagedWindow) {
		if (this.#windows.get(dWindow.id) !== dWindow) return false;
		if (this.#focusedWindow?.id === dWindow.id) this.#focusedWindow = null;
		if (dWindow.alwaysOnTop) this.#windowsOnTop.delete(dWindow.id);
		if (this.#editingWindow?.dWindow === dWindow) {
			dWindow.setEditMode(null);
			this.#editingWindow = null;
		}

		this.#windowsByZIndex.delete(dWindow.zIndex);
		this.removeWindowsMap(dWindow);
		dWindow.close();
		return true;
	}

	public handleMinimize(e: Event, dWindow: ManagedWindow) {
		this.toggleMinimizeWindow(dWindow);
	}

	public handleMaximize(e: Event, dWindow: ManagedWindow) {
		this.toggleMaximizeWindow(dWindow);
	}

	public toggleMaximizeWindow(dWindow: ManagedWindow) {
		dWindow.maximized = !dWindow.maximized;
	}

	public toggleMinimizeWindow(dWindow: ManagedWindow) {
		dWindow.minimized = !dWindow.minimized;
	}

	public handleDragStart(e: MouseEvent, dWindow: ManagedWindow, mode: WindowEditMode) {
		// TODO handle Center anchor

		const offset =
			mode === 'moving' ?
				new Vec2(dWindow.anchor.x * dWindow.position.x - e.clientX, dWindow.anchor.y * dWindow.position.y - e.clientY)
			:	new Vec2(dWindow.anchor.x * dWindow.size.x - e.clientX, dWindow.anchor.y * dWindow.size.y - e.clientY);
		this.#editingWindow = { dWindow, mode, offset };
	}

	public handleDragEnd(e: MouseEvent) {
		if (this.#editingWindow) {
			this.#editingWindow.dWindow.setEditMode(null);
			this.#editingWindow = null;
		}
	}

	public handleDrag(e: MouseEvent) {
		if (!this.#editingWindow?.dWindow) return;
		const dWindow = this.#editingWindow.dWindow;

		if (this.#editingWindow.mode === 'moving') {
			dWindow.setPosition(
				dWindow.anchor.x * (e.clientX + this.#editingWindow.offset.x),
				dWindow.anchor.y * (e.clientY + this.#editingWindow.offset.y)
			);
		} else {
			dWindow.setSize(
				dWindow.anchor.x * (e.clientX + this.#editingWindow.offset.x),
				dWindow.anchor.y * (e.clientY + this.#editingWindow.offset.y)
			);
		}
	}

	public handleFocus(e: FocusEvent, dWindow: ManagedWindow) {
		this.focusWindow(dWindow);
	}
	public handleBlur(e: FocusEvent, dWindow: ManagedWindow) {
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

	public isNodeDisplayWindow(node: EventTarget) {
		return node instanceof HTMLElement && node.nodeName === 'DIV' && node.hasAttribute('data-window-class');
	}

	public createWindow<P extends object = Record<string, unknown>>(options: CreateWindowParams<P>): DisplayWindow<P> {
		const dWindow = new DisplayWindow<P>(this.determineNewWindowId(), options.content);

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
		if (options.anchor) dWindow.setAnchorEnum(options.anchor);
		if (options.buttons) dWindow.buttons = options.buttons;
		if (options.parent != null) dWindow.setParent(options.parent);
		if (options.children?.length) dWindow.addChildren(options.children);
		dWindow.layout = options.layout ? options.layout : this.generateDefaultWindowLayout(dWindow);

		this.registerWindow(dWindow);
		return dWindow;
	}

	public createClassWindow<T extends ManagedWindow>(dWindow: T): T {
		dWindow.id = this.determineNewWindowId();
		this.registerWindow(dWindow);
		return dWindow;
	}

	private registerWindow(dWindow: ManagedWindow) {
		if (this.#disposed) throw new Error('Cannot register a window with a disposed WindowService');
		if (this.#windows.size >= WindowService.MAX_WINDOWS)
			throw new Error(`Failed to register window: maximum number of windows is ${WindowService.MAX_WINDOWS}`);

		if (dWindow.focused) this.focusWindow(dWindow);
		if (dWindow.alwaysOnTop) this.#windowsOnTop.add(dWindow.id);
		this.setWindowsMap(dWindow);
	}

	private generateDefaultWindowLayout(dWindow: ManagedWindow) {
		return new WindowLayout({
			maximizeButton: dWindow.maximizable,
			minimizeButton: dWindow.minimizable,
			title: !!dWindow.title
		});
	}

	private setWindowsMap(dWindow: ManagedWindow) {
		this.#windows.set(dWindow.id, dWindow);
		this.publishWindowMembership();
	}

	private removeWindowsMap(dWindow: ManagedWindow) {
		if (this.#windows.get(dWindow.id) !== dWindow) return;
		this.#windows.delete(dWindow.id);
		this.publishWindowMembership();
	}

	private publishWindowMembership() {
		this.#windowsStore.set(Object.freeze([...this.#windows.values()]));
	}

	public dispose() {
		if (this.#disposed) return;
		this.#disposed = true;
		this.#unsubscribeClose();
		if (this.#editingWindow) this.#editingWindow.dWindow.setEditMode(null);
		this.#editingWindow = null;
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
