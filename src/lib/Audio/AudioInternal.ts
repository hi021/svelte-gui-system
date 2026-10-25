import type { MediaState } from './MediaState';

type AudioAccess = {
	setElement: (element: HTMLAudioElement | undefined) => void;
	setState: (state: MediaState) => void;
};

const audioAccess = new WeakMap<object, AudioAccess>();

export function registerAudioAccess(audio: object, access: AudioAccess) {
	audioAccess.set(audio, access);
}

export function aliasAudioAccess(alias: object, audio: object) {
	const access = audioAccess.get(audio);
	if (access) audioAccess.set(alias, access);
}

export function setAudioElement(audio: object, element: HTMLAudioElement | undefined) {
	audioAccess.get(audio)?.setElement(element);
}

export function setAudioState(audio: object, state: MediaState) {
	audioAccess.get(audio)?.setState(state);
}
