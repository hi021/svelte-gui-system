<script lang="ts">
	import AudioComponentContainer from '$lib/Audio/AudioComponentContainer.svelte';
	import { AudioService } from '$lib/Audio/AudioService';
	import { Color } from '$lib/Color/Color';
	import { ColorEnum } from '$lib/Color/ColorEnum';
	import { EventService } from '$lib/Event/EventService';
	import { WindowCloseEvent } from '$lib/Event/WindowCloseEvent';
	import { GameState } from '$lib/GameState.svelte';
	import { PredicateMode } from '$lib/Util/PredicateMode';
	import { Vec2 } from '$lib/Util/Vec2';
	import { AnchorPoint } from '$lib/Window/AnchorPoint';
	import { ButtonConfiguration } from '$lib/Window/Button/ButtonConfiguration';
	import { ButtonHelper } from '$lib/Window/Button/ButtonHelper';
	import { ButtonLayout } from '$lib/Window/Button/ButtonLayout';
	import { WindowButton } from '$lib/Window/Button/WindowButton';
	import { content } from '$lib/Window/Contents/Templates/NotificationTemplate.svelte';
	import { DisplayWindow as DWindow } from '$lib/Window/DisplayWindow';
	import DisplayWindow from '$lib/Window/DisplayWindowComponent.svelte';
	import { NotificationWindow } from '$lib/Window/Templates/NotificationWindow';
	import { WindowService } from '$lib/Window/WindowService';
	import { onDestroy } from 'svelte';

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

	audioManager.registerAudioObject('/poggers.mp3', 'poggers');
	const longAudio = audioManager.registerAudioObject('/sewer.mp3', 'sewer', false);

	const handleDrag = (e: MouseEvent) => windowManager.handleDrag(e);
	const handleDragEnd = (e: MouseEvent) => windowManager.handleDragEnd(e);
	document.addEventListener('mousemove', handleDrag);
	document.addEventListener('mouseup', handleDragEnd);

	let windows: DWindow[] = [];
	const windowsUnsubscriber = windowManager.windows.subscribe((value) => (windows = value));
	onDestroy(() => {
		windowsUnsubscriber();
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
		objectClass: 'clickable',
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

<!-- EXAMPLE WINDOW CONTENT - CAN BE MOVED TO SEPARATE .SVELTE COMPONENTS (see Window/Contents) -->
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

<AudioComponentContainer {audioManager} />

<!-- -->
<main class="container" style="display: flex; flex-direction: column; flex: 1 1 auto;">
	<h1 style="width: 100%; text-align:center;">${gameState.money}</h1>

	<!-- TODO: Probably want that in a separate container component -->
	{#each windows as dWindow}
		<DisplayWindow
			{dWindow}
			onclose={(e) => EventService.dispatchEvent(new WindowCloseEvent(dWindow))}
			onminimize={(e) => windowManager.handleMinimize(e, dWindow)}
			onmaximize={(e) => windowManager.handleMaximize(e, dWindow)}
			onfocus={(e) => windowManager.handleFocus(e, dWindow)}
			onblur={(e) => windowManager.handleBlur(e, dWindow)}
			onmovestart={(e: MouseEvent) => {
				dWindow.setEditMode('moving');
				if (dWindow.editMode !== 'moving') return;

				if (dWindow.maximized) {
					dWindow.maximized = false;
					dWindow.position = new Vec2(100, 200); // TODO OFFSET
				}
				windowManager.handleDragStart(e, dWindow, dWindow.editMode);
			}}
			onresizestart={(e: MouseEvent) => {
				dWindow.editMode == 'resizing' && windowManager.handleDragStart(e, dWindow, dWindow.editMode);
			}} />
	{/each}

	<div class="btn-container unselectable" style="width: fit-content; background-color: rgba(255,255,255,0.25);">
		<div class="row">
			<button onclick={() => longAudio.play()}> Play </button>
			<button onclick={() => longAudio.pause()}> Pause </button>
			<button onclick={() => longAudio.stop()}> Stop </button>
			<button onclick={() => longAudio.rewind()}> Rewind </button>
			<button onclick={() => longAudio.replay()}> Replay </button>
			<button onclick={() => (longAudio.speed += 0.33)}> speed up! </button>
			<button onclick={() => (longAudio.speed -= 0.33)}> speed down!! </button>
			<button onclick={() => (longAudio.volume += 0.16)}> volume up! </button>
			<button onclick={() => (longAudio.volume -= 0.16)}> volume down!! </button>
			<button onclick={() => audioManager.unregisterAudioObject({ path: longAudio.path })}> Delete </button>
		</div>

		<div class="row">
			<button onclick={() => windowManager.createWindow(alwaysOnTopWindowParams)}> Always On Top </button>
			<button
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
				Y/N NotificationWindow
			</button>
			<button onclick={() => (windows[0].props!.text = 'Changed...')}>Change notif prop woah</button>
		</div>

		<div class="row">
			<button
				onclick={() => {
					console.log(windowManager.focusedWindow);
				}}>Get focused window</button>
			<button
				onclick={() => {
					windowManager.debugAllObjects();
					audioManager.debugAllObjects();
				}}>Big debug button</button>
			<button
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
			<button onclick={() => ++gameState.money}>Add moner</button>
		</div>

		<form>
			<input type="text" bind:value={finderInputText} />
			<button
				type="submit"
				onclick={() => console.log(windowManager.getWindowsByPredicates(JSON.parse(finderInputText)))}>Find ALL</button>
		</form>
		<form>
			<input type="text" bind:value={factoryInputText} />
			<button type="submit" onclick={() => windowManager.createWindow(JSON.parse(factoryInputText))}>Create</button>
		</form>
	</div>
</main>

<style>
	.btn-container {
		z-index: 99;
	}
</style>
