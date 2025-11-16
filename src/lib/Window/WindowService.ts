import type { Snippet } from "svelte";
import type { WindowLayout } from "./WindowLayout";
import type { WindowButton } from "./Button/WindowButton";
import { Vec2 } from "../Vec2";
import { writable } from "svelte/store";
import { AnchorPoint } from "./AnchorPoint";
import { PredicateMode } from "../PredicateMode";
import { DisplayWindow, type WindowEditMode } from "./DisplayWindow";
import { EventService } from "$lib/Event/EventService";

type EditingWindow = {
	dWindow: DisplayWindow;
	offset: Vec2;
	mode: WindowEditMode;
};

type CreateWindowParams = {
	title?: string;
	windowClass?: string;
	layout?: WindowLayout;
	position?: Vec2;
	minimizable?: boolean;
	maximizable?: boolean;
	resizeable?: boolean;
	draggable?: boolean;
	alwaysOnTop?: boolean;
	focused?: boolean;
	minimized?: boolean;
	maximized?: boolean;
	backdropVisible?: boolean;
	customContainerStyle?: string;
	props?: Record<string, any>;
	parent?: DisplayWindow;
	children?: DisplayWindow[];
	size?: Vec2;
	anchor?: AnchorPoint;
	buttons?: WindowButton[];
	content: Snippet<[Record<string, any> | undefined]>;
};

export class WindowService {
	static readonly MAX_WINDOWS = 99;
	static readonly DEFAULT_Z_INDEX = 3;
	static readonly TOP_Z_INDEX = WindowService.DEFAULT_Z_INDEX + WindowService.MAX_WINDOWS + 3;

	#windows = new Map<number, DisplayWindow>();
	#windowsStore = writable<DisplayWindow[]>([]);
	#windowsOnTop = new Set<number>();
	#windowsByZIndex = new Map<number, number>();
	#focusedWindow: DisplayWindow | null = null;
	#editingWindow: EditingWindow | null = null;
	#windowIdSequence = 1;

	public constructor() {
		EventService.windowCloseEvent.subscribe((event) => event && this.closeWindow(event.sourceWindow));
		EventService.windowModificationEvent.subscribe((event) => event && this.updateWindowsStore());
	}

	public static windowExists(dWindow?: DisplayWindow) {
		return !!dWindow?.id;
	}

	public get windows() {
		return this.#windowsStore;
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

	public getWindowsByPredicates(predicates: Record<string, any>, mode = PredicateMode.ALL) {
		const windows: DisplayWindow[] = [];
		for (const [k, dWindow] of this.#windows) {
			if (dWindow.matchesPredicates(predicates, mode)) windows.push(dWindow);
		}
		return windows;
	}

	public getWindowsByClass(windowClass: string) {
		return this.getWindowsByPredicates({ windowClass }, PredicateMode.ANY);
	}

	public getWindowsByTitle(title: string) {
		return this.getWindowsByPredicates({ title }, PredicateMode.ANY);
	}

	public getFirstWindowByTitle(title: string) {
		for (const [k, dWindow] of this.#windows) {
			if (dWindow.title == title) return dWindow;
		}
	}

	public debugAllWindows() {
		let debugString = "";
		for (const [i, dWindow] of this.#windows) debugString += i + "\t" + dWindow.toString() + "\n";
		console.log(debugString);
	}

	public handleClose(e: Event, dWindow: DisplayWindow) {
		return this.closeWindow(dWindow);
	}

	public closeWindow(dWindow: DisplayWindow) {
		if (this.#focusedWindow?.id == dWindow.id) this.#focusedWindow = null;
		if (dWindow.alwaysOnTop) this.#windowsOnTop.delete(dWindow.id);

		this.#windowsByZIndex.delete(dWindow.zIndex);
		this.removeWindowsMap(dWindow);
		dWindow.close();
		return true;
	}

	public handleMinimize(e: Event, dWindow: DisplayWindow) {
		this.toggleMinimizeWindow(dWindow);
	}

	public handleMaximize(e: Event, dWindow: DisplayWindow) {
		this.toggleMaximizeWindow(dWindow);
	}

	public toggleMaximizeWindow(dWindow: DisplayWindow) {
		dWindow.maximized = !dWindow.maximized;
	}

	public toggleMinimizeWindow(dWindow: DisplayWindow) {
		dWindow.minimized = !dWindow.minimized;
	}

	public handleDragStart(e: MouseEvent, dWindow: DisplayWindow, mode: WindowEditMode) {
		// TODO handle Center anchor

		const offset =
			mode == "moving"
				? new Vec2(dWindow.anchor.x * dWindow.position.x - e.clientX, dWindow.anchor.y * dWindow.position.y - e.clientY)
				: new Vec2(dWindow.anchor.x * dWindow.size.x - e.clientX, dWindow.anchor.y * dWindow.size.y - e.clientY);
		this.#editingWindow = { dWindow, mode, offset };
	}

	public handleDragEnd(e: MouseEvent) {
		if (this.#editingWindow) {
			this.#editingWindow.dWindow.editMode = null;
			this.#editingWindow = null;
		}
	}

	public handleDrag(e: MouseEvent) {
		if (!this.#editingWindow?.dWindow) return;
		const dWindow = this.#editingWindow.dWindow;

		if (this.#editingWindow.mode == "moving") {
			dWindow.setPosition(
				(dWindow.position.x = dWindow.anchor.x * (e.clientX + this.#editingWindow.offset.x)),
				(dWindow.position.y = dWindow.anchor.y * (e.clientY + this.#editingWindow.offset.y))
			);
		} else
			dWindow.setSize(
				dWindow.anchor.x * (e.clientX + this.#editingWindow.offset.x),
				dWindow.anchor.y * (e.clientY + this.#editingWindow.offset.y)
			);

		this.updateWindowsStore();
	}

	public handleFocus(e: FocusEvent, dWindow: DisplayWindow) {
		this.focusWindow(dWindow);
	}

	public focusWindow(dWindow: DisplayWindow) {
		// TODO
		if (this.#focusedWindow) {
			this.#focusedWindow.focused = false;
		}

		dWindow.focused = true;
		this.#focusedWindow = dWindow;
		this.setFocusedWindowZIndex(dWindow);
		this.updateWindowsStore();
	}

	public createWindow(options: CreateWindowParams) {
		const dWindow = new DisplayWindow(this.determineNewWindowId(), options.content);

		if (options.title) dWindow.title = options.title;
		if (options.windowClass) dWindow.windowClass = options.windowClass;
		if (options.layout) dWindow.layout = options.layout;
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
		if (options.customContainerStyle) dWindow.customContainerStyle = options.customContainerStyle;
		if (options.props) dWindow.props = options.props;
		if (options.size) dWindow.size = options.size;
		if (options.anchor) dWindow.setAnchorEnum(options.anchor);
		if (options.buttons) dWindow.buttons = options.buttons;
		if (options.parent != null) dWindow.setParent(options.parent);
		if (options.children?.length) dWindow.addChildren(options.children);

		this.registerWindow(dWindow);
	}

	public createClassWindow(dWindow: DisplayWindow) {
		dWindow.id = this.determineNewWindowId();
		this.registerWindow(dWindow);
	}

	private registerWindow(dWindow: DisplayWindow) {
		if (this.#windows.size >= WindowService.MAX_WINDOWS)
			throw new Error("Failed to register window: DisplayWindow array overflow - please destroy existing windows");

		if (dWindow.focused) this.focusWindow(dWindow);
		if (dWindow.alwaysOnTop) this.#windowsOnTop.add(dWindow.id);
		this.setWindowsMap(dWindow);
	}

	private setWindowsMap(dWindow: DisplayWindow) {
		this.#windows.set(dWindow.id, dWindow);
		this.updateWindowsStore();
	}

	private removeWindowsMap(dWindow: DisplayWindow) {
		this.#windows.delete(dWindow.id);
		this.updateWindowsStore();
	}

	private updateWindowsStore() {
		this.#windowsStore.set([...this.#windows.values()]);
	}

	private setFocusedWindowZIndex(dWindow: DisplayWindow) {
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
