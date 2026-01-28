<script lang="ts">
	import DisplayWindow from '$lib/Window/DisplayWindow.svelte';
	import { content } from '$lib/Window/Contents/Templates/NotificationTemplate.svelte';
	import { DisplayWindow as DWindow } from '$lib/Window/DisplayWindow';
	import { WindowService } from '$lib/Window/WindowService';
	import { PredicateMode } from '$lib/PredicateMode';
	import { WindowButton } from '$lib/Window/Button/WindowButton';
	import { AnchorPoint } from '$lib/Window/AnchorPoint';
	import { GameState } from '$lib/GameState.svelte';
	import { onDestroy } from 'svelte';
	import { Vec2 } from '$lib/Vec2';
	import { Color } from '$lib/Color/Color';
	import { ColorEnum } from '$lib/Color/ColorEnum';
	import { NotificationWindow } from '$lib/Window/Templates/NotificationWindow';
	import { EventService } from '$lib/Event/EventService';
	import { WindowCloseEvent } from '$lib/Event/WindowCloseEvent';
	import { ButtonConfiguration } from '$lib/Window/Button/ButtonConfiguration';
	import { ButtonLayout } from '$lib/Window/Button/ButtonLayout';
	import { ButtonHelper } from '$lib/Window/Button/ButtonHelper';
	import { AudioService } from '$lib/Audio/AudioService';
	import { Audio as AudioObject } from '$lib/Audio/Audio.svelte';
	import Audio from '$lib/Audio/AudioComponent.svelte';

	let finderInputText: string;
	let factoryInputText: string;

	const v1 = new Vec2(300, 300);
	const v2 = new Vec2(300, 300);
	const button = new WindowButton();
	button.action = (e, dWindow) => (dWindow.backdropVisible = !dWindow.backdropVisible);
	button.text = 'Toggle backdrop idk man';

	const alwaysOnTopWindowParams = {
		title: 'TOP',
		customContainerStyle: `background-color: ${new Color(ColorEnum.INFO)};`,
		size: v2,
		alwaysOnTop: true,
		content: content,
		props: { text: 'New dupa' },
		buttons: [button]
	};

	const gameState = new GameState();
	const windowManager = new WindowService();
	const audioManager = new AudioService();

	// TODO: separate component for all audio objects
	audioManager.registerAudioObject('/poggers.mp3', 'poggers', true);

	const handleDrag = (e: MouseEvent) => windowManager.handleDrag(e);
	const handleDragEnd = (e: MouseEvent) => windowManager.handleDragEnd(e);
	document.addEventListener('mousemove', handleDrag);
	document.addEventListener('mouseup', handleDragEnd);

	let windows: DWindow[] = [];
	let audioObjects: AudioObject[] = [];
	const windowsUnsubscriber = windowManager.windows.subscribe((value) => (windows = value));
	const audioObjectsUnsubscriber = audioManager.audioObjects.subscribe((value) => (audioObjects = value));
	onDestroy(() => {
		windowsUnsubscriber();
		audioObjectsUnsubscriber();
		document.removeEventListener('mousemove', handleDrag);
		document.removeEventListener('mouseup', handleDragEnd);
	});

	windowManager.createWindow({
		title: 'Notif!',
		customContainerStyle: 'background-color: #33aa55;',
		position: v1,
		content: content,
		props: { text: 'This is prop text :)' }
	});
	// windowManager.createWindow({
	// 	title:
	// 		"veeeery looooong title that I haave to pad somehow, so anyway what's up? how you doing? the kids? yeah, I ate them. Or I mean wait-",
	// 	content: customContent,
	// 	anchor: AnchorPoint.BOTTOM_RIGHT
	// });
	// windowManager.createWindow({
	// 	title:
	// 		"veeeery looooong title that I haave to pad somehow, so anyway what's up? how you doing? the kids? yeah, I ate them. Or I mean wait-",
	// 	content: customContent,
	// 	anchor: AnchorPoint.TOP_RIGHT
	// });
	const clickableBtn = new WindowButton();
	clickableBtn.text = 'Clicc';
	clickableBtn.action = () => {
		++gameState.money;
	};
	windowManager.createWindow({
		windowClass: 'clickable',
		anchor: AnchorPoint.BOTTOM_LEFT,
		props: { toClick: gameState },
		content: clickable,
		buttons: [clickableBtn]
	});
	windowManager.createWindow({
		content: customContent
	});

	function playSenko() {
		audioManager.replayByTag('poggers');
	}
</script>

{#snippet clickable(props?: { toClick?: GameState })}
	{#key props?.toClick}
		<p>
			Current cliccy: {props?.toClick?.money}
		</p>
	{/key}
{/snippet}

{#snippet customContent()}
	<img
		class="unselectable"
		src="https://poggers.ltd/static/media/senko-poggers.ad2cb0b444bab5076f61.png"
		alt="POGGERS"
		style="position: absolute; z-index: 0; inset: 0; width: 100%; height: 100%;" />
	<button
		style="position: relative; z-index: 2; font-size: 2em;"
		onclick={() => {
			gameState.money += Math.round(Math.random() * 300);
			playSenko();
		}}>pog now</button>
{/snippet}

{#each audioObjects as audioObject}
	<Audio audio={audioObject} />
{/each}

<main class="container" style="display: flex; flex-direction:column;flex: 1 1 auto;">
	<h1 style="width: 100%; text-align:center;">${gameState.money}</h1>

	{#each windows as dWindow}
		<DisplayWindow
			{dWindow}
			onclose={(e) => EventService.dispatchEvent(new WindowCloseEvent(dWindow))}
			onminimize={(e) => windowManager.handleMinimize(e, dWindow)}
			onmaximize={(e) => windowManager.handleMaximize(e, dWindow)}
			onfocus={(e) => windowManager.handleFocus(e, dWindow)}
			onmovestart={(e: MouseEvent) => {
				dWindow.editMode == 'moving' && windowManager.handleDragStart(e, dWindow, dWindow.editMode ?? 'moving');
			}}
			onresizestart={(e: MouseEvent) => {
				dWindow.editMode == 'resizing' && windowManager.handleDragStart(e, dWindow, dWindow.editMode);
			}} />
	{/each}

	<button style="z-index: 90; display: block;" onclick={playSenko}> Play poggers audio </button>
	<button style="z-index: 90; display: block;" onclick={() => windowManager.createWindow(alwaysOnTopWindowParams)}>
		Always On Top
	</button>
	<button
		style="z-index: 90; display: block;"
		onclick={() => {
			const dWindow = new NotificationWindow(
				'You have just created a notification!!',
				'With a title even!',
				ButtonConfiguration.YES_NO,
				[ButtonHelper.getWindowCloseAction(), () => console.log('Nwahh')]
			);
			dWindow.layout.buttonLayout = ButtonLayout.SPACE_BETWEEN;
			windowManager.createClassWindow(dWindow);
		}}>
		NotificationWindow
	</button>
	<button style="z-index: 90; display: block;" onclick={() => (windows[0].props!.text = 'Changed...')}
		>Change notif prop woah</button>
	<button style="z-index: 90; display: block;" onclick={() => windowManager.debugAllWindows()}>Big debug button</button>
	<button
		style="z-index: 90; display: block;"
		onclick={() => {
			console.log('Class NONE:', windowManager.getWindowsByClass('NONE'));
			console.log('Class DUPA:', windowManager.getWindowsByClass('DUPA'));
			console.log('Title[] TOP:', windowManager.getWindowsByTitle('TOP'));
			console.log('Title TOP:', windowManager.getFirstWindowByTitle('TOP'));
			console.log('zIndex 4:', windowManager.getWindowByZIndex(4));
			console.log('id 1:', windowManager.getWindowById(1));
			console.log(
				'ANY Predicates:',
				windowManager.getWindowsByPredicates(
					{ alwaysOnTop: true, draggable: true, minimized: false },
					PredicateMode.ANY
				)
			);
		}}>Finder test</button>
	<button style="z-index: 90; display: block;" onclick={() => ++gameState.money}>Add moner</button>
	<form style="z-index: 90;">
		<input type="text" bind:value={finderInputText} />
		<button type="submit" onclick={() => console.log(windowManager.getWindowsByPredicates(JSON.parse(finderInputText)))}
			>Find ALL</button>
	</form>
	<form style="z-index: 90;">
		<input type="text" bind:value={factoryInputText} />
		<button type="submit" onclick={() => windowManager.createWindow(JSON.parse(factoryInputText))}>Create</button>
	</form>
</main>
