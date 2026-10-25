const windowAccess = new WeakMap<object, (element: HTMLDivElement | undefined) => void>();

export function registerWindowAccess(window: object, setElement: (element: HTMLDivElement | undefined) => void) {
	windowAccess.set(window, setElement);
}

export function setWindowElement(window: object, element: HTMLDivElement | undefined) {
	windowAccess.get(window)?.(element);
}
