<script lang="ts">
	import AudioComponentContainer from '$lib/Audio/AudioComponentContainer.svelte';
	import { AudioService } from '$lib/Audio/AudioService';
	import { Color } from '$lib/Color/Color';
	import { ColorEnum } from '$lib/Color/ColorEnum';
	import { GameState } from '$lib/GameState.svelte';
	import { PredicateMode } from '$lib/Util/PredicateMode';
	import { Vec2 } from '$lib/Util/Vec2';
	import { AnchorPoint } from '$lib/Window/AnchorPoint';
	import { ButtonConfiguration } from '$lib/Window/Button/ButtonConfiguration';
	import { ButtonHelper } from '$lib/Window/Button/ButtonHelper';
	import { ButtonLayout } from '$lib/Window/Button/ButtonLayout';
	import { WindowButton } from '$lib/Window/Button/WindowButton';
	import { content } from '$lib/Window/Contents/Templates/NotificationTemplate.svelte';
	import DisplayWindowComponentContainer from '$lib/Window/DisplayWindowComponentContainer.svelte';
	import { NotificationWindow } from '$lib/Window/Templates/NotificationWindow';
	import { WindowService, type CreateWindowParams } from '$lib/Window/WindowService';

	let finderInputText: string;
	let factoryInputText: string;

	const gameState = new GameState();
	const windowManager = new WindowService();
	const audioManager = new AudioService();

	// -------------------------------- Showcase windows init
	const v1 = new Vec2(300, 300);
	const v2 = new Vec2(300, 300);

	const alwaysOnTopBtn = new WindowButton();
	alwaysOnTopBtn.action = (e, dWindow) => {
		dWindow.backdropVisible = !dWindow.backdropVisible;
		dWindow.forceRefreshAllWindows();
	};
	alwaysOnTopBtn.text = 'Toggle backdrop idk man';
	const alwaysOnTopWindowParams: CreateWindowParams = {
		title: 'TOP',
		customWindowContainerCss: `background-color: ${new Color(ColorEnum.SUCCESS)};`,
		customContentContainerCss: `background-color: ${new Color(ColorEnum.WARNING)};`,
		size: v2,
		alwaysOnTop: true,
		minimizable: false,
		maximizable: false,
		content: content,
		props: { text: 'New dupa' },
		buttons: [alwaysOnTopBtn]
	};

	const testWindow1 = windowManager.createWindow({
		title: 'Notif!',
		position: v1,
		content: content,
		props: { text: 'This is prop text :)' }
	});

	windowManager.createWindow({
		title:
			"veeeery looooong title that I haave to pad somehow, so anyway what's up? how you doing? the kids? yeah, I ate them. Or I mean wait-",
		content: content,
		anchor: AnchorPoint.TOP_RIGHT
	});

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
		content: senkoPogContent,
		anchor: AnchorPoint.TOP_RIGHT
	});
	// -------------------------------- Showcase windows init

	audioManager.registerAudioObject('/poggers.mp3', 'poggers');
	const longAudio = audioManager.registerAudioObject('/sewer.mp3', 'sewer', false);
	function playSenko() {
		audioManager.replayByTag('poggers');
	}
</script>

<!-- EXAMPLE WINDOW CONTENT - CAN BE MOVED TO SEPARATE .SVELTE COMPONENTS (see src/Window/Contents) -->
{#snippet clickable(props?: { toClick?: GameState })}
	<p>
		Current cliccy: {props?.toClick?.money}
	</p>
	<p>Paragraph no. 2 hello!</p>
	<input type="text" value="Wowww this window extends so farrr" />
	<p>wouldn't it suck if the overflow:auto broke?</p>
{/snippet}

{#snippet senkoPogContent()}
	<img
		class="unselectable"
		src="https://poggers.moe/static/media/senko-poggers.ad2cb0b444bab5076f61.png"
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

<main class="container" style="display: flex; flex-direction: column; flex: 1 1 auto;">
	<div class="top-ui-wrapper">
		<div class="top-ui-container">
			<span>Hello</span>
		</div>
		<div class="top-ui-container">
			<span>${gameState.money}</span>
		</div>
		<div class="top-ui-container">
			<span>Svelte Gaming</span>
		</div>
	</div>

	<DisplayWindowComponentContainer {windowManager} />

	<div
		class="btn-container unselectable"
		style="width: fit-content; background-color: rgba(255,255,255,0.25); z-index: 99;">
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
			<button onclick={() => (testWindow1.props!.text = 'This is CHANGED prop text')}>Change notif prop woah</button>
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
	.top-ui-wrapper {
		display: flex;
		justify-content: space-between;
		padding: 0 16px;
	}

	.top-ui-container {
		background-color: var(--color-info);
		padding: 8px;
		border-radius: 6px;
	}
</style>
