// TODO: this is a fallback for sveltejs/package's generated typings, should be removed to lessen the maintenance burden

import type { ComponentProps } from 'svelte';
import {
	Audio,
	AudioComponent,
	AudioComponentContainer,
	BlankTemplate,
	DisplayWindow,
	DisplayWindowComponent,
	DisplayWindowComponentContainer,
	Icon,
	NotificationTemplate,
	WindowButton,
	WindowButtonComponent,
	WindowService,
	AudioService
} from 'svelte-gui-system';

const iconProps: ComponentProps<typeof Icon> = { tag: 'window-close' };
// @ts-expect-error Icon does not accept undeclared properties.
const invalidIconProps: ComponentProps<typeof Icon> = { notAProp: true };

const audioProps: ComponentProps<typeof AudioComponent> = {
	audio: new Audio(1, '/audio.ogg'),
	onplay: () => undefined,
	onpause: () => undefined,
	onended: () => undefined
};
const invalidAudioProps: ComponentProps<typeof AudioComponent> = {
	...audioProps,
	// @ts-expect-error AudioComponent requires an Audio instance.
	audio: 'not an Audio instance'
};

declare const audioManager: AudioService;
const audioContainerProps: ComponentProps<typeof AudioComponentContainer> = { audioManager };
// @ts-expect-error AudioComponentContainer requires its manager prop.
const invalidAudioContainerProps: ComponentProps<typeof AudioComponentContainer> = {};

declare const dWindow: DisplayWindow<any>;
const buttonProps: ComponentProps<typeof WindowButtonComponent> = {
	button: new WindowButton(),
	dWindow
};
// @ts-expect-error WindowButtonComponent requires a button.
const invalidButtonProps: ComponentProps<typeof WindowButtonComponent> = { dWindow };

const displayWindowProps: ComponentProps<typeof DisplayWindowComponent> = {
	dWindow,
	isFocused: () => false,
	onclose: () => undefined,
	onminimize: () => undefined,
	onmaximize: () => undefined,
	onfocus: () => undefined,
	onblur: () => undefined,
	onmovestart: () => undefined,
	onresizestart: () => undefined
};
// @ts-expect-error DisplayWindowComponent requires its interaction callbacks.
const invalidDisplayWindowProps: ComponentProps<typeof DisplayWindowComponent> = { dWindow };

declare const windowManager: WindowService;
const displayWindowContainerProps: ComponentProps<typeof DisplayWindowComponentContainer> = {
	windowManager
};
// @ts-expect-error DisplayWindowComponentContainer requires its manager prop.
const invalidDisplayWindowContainerProps: ComponentProps<typeof DisplayWindowComponentContainer> = {};

BlankTemplate();
// @ts-expect-error BlankTemplate has no snippet arguments.
BlankTemplate({ text: 'unexpected' });

NotificationTemplate({ text: 'ready' });
// @ts-expect-error NotificationTemplate text must be a string.
NotificationTemplate({ text: 123 });

void [
	iconProps,
	invalidIconProps,
	audioProps,
	invalidAudioProps,
	audioContainerProps,
	invalidAudioContainerProps,
	buttonProps,
	invalidButtonProps,
	displayWindowProps,
	invalidDisplayWindowProps,
	displayWindowContainerProps,
	invalidDisplayWindowContainerProps
];