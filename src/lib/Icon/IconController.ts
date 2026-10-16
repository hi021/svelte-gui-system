import Util from '../Util/Util';
import { IconType } from './IconType';

export type IconSource = { type: IconType.SVG; value: string } | { type: IconType.URL; value: string };

export class IconController {
	readonly #icons = new Map<string, IconSource>();
	readonly #loadedUrls = new Map<string, Promise<string>>();

	public getIcon(tag: string) {
		return this.#icons.get(tag);
	}

	public registerIcon(type: IconType, tag: string, svg: string) {
		return this.registerSource(tag, { type, value: svg });
	}

	public replaceIcon(type: IconType, tag: string, svg: string) {
		this.validate(tag, svg);
		this.#icons.set(tag, { type, value: svg });
	}

	public unregisterIcon(tag: string) {
		if (!this.#icons.delete(tag)) {
			console.warn(`Attempting to unregister inexistent icon with tag "${tag}"`);
			return false;
		}
		return true;
	}

	public async resolveSource(source: IconSource): Promise<string> {
		if (source.type === IconType.SVG) return source.value;

		const url = Util.validateLocalUrl(source.value);
		let loaded = this.#loadedUrls.get(url.href);
		if (!loaded) {
			loaded = fetch(url, { redirect: 'error' }).then((response) => {
				if (!response.ok) throw new Error(`Failed to load icon SVG: ${response.status} ${response.statusText}`);
				return response.text();
			});
			this.#loadedUrls.set(url.href, loaded);
			loaded.catch(() => this.#loadedUrls.delete(url.href));
		}

		return loaded;
	}

	private registerSource(tag: string, source: IconSource) {
		this.validate(tag, source.value);
		if (this.#icons.has(tag))
			console.warn(
				`Overwriting already registered icon with tag "${tag}" - use replaceIcon() to get rid of this warning.`
			);

		this.#icons.set(tag, source);
	}

	private validate(tag: string, value: string) {
		if (!tag?.trim()) throw new TypeError('Icon tag must not be empty');
		if (!value?.trim()) throw new TypeError('Icon source must not be empty');
	}
}

// TODO!: icon sets and constructor that uses them
export const iconController = new IconController();

iconController.registerIcon(
	IconType.SVG,
	'window-minimize',
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 18h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
);
iconController.registerIcon(
	IconType.SVG,
	'window-maximize',
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v12h12V6H6Z" fill="currentColor"/></svg>'
);
iconController.registerIcon(
	IconType.SVG,
	'window-close',
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
);
