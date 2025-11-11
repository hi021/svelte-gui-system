<script lang="ts">
	import DisplayWindow from "$lib/Window/DisplayWindow.svelte";
	import { content } from "$lib/Window/NotificationPopupContent.svelte";
	import { DisplayWindow as DWindow } from "$lib/Window/DisplayWindow";
	import { WindowService } from "$lib/WindowManagerService";
	import { WindowButton } from "$lib/Window/WindowButton";
	import { AnchorPoint } from "$lib/Window/AnchorPoint";
	import { GameState } from "$lib/GameState.svelte";
	import { onDestroy } from "svelte";
	import { Vec2 } from "$lib/Vec2";
	import { PredicateMode } from "$lib/PredicateMode";

	let finderInputText: string;

	const v1 = new Vec2(300, 300);
	const v2 = new Vec2(300, 300);
	const button = new WindowButton();
	button.text = "OK";
	const gameState = new GameState();
	const windowManager = new WindowService();

	const handleDrag = (e: MouseEvent) => windowManager.handleDrag(e);
	const handleDragEnd = (e: MouseEvent) => windowManager.handleDragEnd(e);
	document.addEventListener("mousemove", handleDrag);
	document.addEventListener("mouseup", handleDragEnd);

	let windows: DWindow[] = [];
	const windowsUnsubscriber = windowManager.windows.subscribe((value) => (windows = value));
	onDestroy(() => {
		windowsUnsubscriber();
		document.removeEventListener("mousemove", handleDrag);
		document.removeEventListener("mouseup", handleDragEnd);
	});

	windowManager.createWindow({
		title: "Notif!",
		customContainerStyle: "background-color: #33aa55;",
		position: v1,
		content: content,
		props: { text: "This is prop text :)" }
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
	clickableBtn.text = "Clicc";
	clickableBtn.action = () => {
		++gameState.money;
		console.log("Clicc", gameState.money);
	};
	windowManager.createWindow({
		windowClass: "clickable",
		anchor: AnchorPoint.BOTTOM_LEFT,
		props: { toClick: gameState },
		content: clickable,
		buttons: [clickableBtn]
	});
</script>

{#snippet clickable(props?: { toClick?: GameState })}
	{#key props?.toClick}
		<p>
			Current cliccy: {props?.toClick?.money}
		</p>
	{/key}
{/snippet}

{#snippet customContent()}
	<img src="https://poggers.ltd/static/media/senko-poggers.ad2cb0b444bab5076f61.png" alt="POGGERS" />
{/snippet}

<main class="container" style="display: flex; flex-direction:column;flex: 1 1 auto;">
	<h1 style="width: 100%; text-align:center;">${gameState.money}</h1>

	{#each windows as dWindow}
		<DisplayWindow
			{dWindow}
			onclose={(e) => windowManager.handleClose(e, dWindow)}
			onminimize={(e) => windowManager.handleMinimize(e, dWindow)}
			onmaximize={(e) => windowManager.handleMaximize(e, dWindow)}
			onfocus={(e) => windowManager.handleFocus(e, dWindow)}
			ondragstart={(e) => windowManager.handleDragStart(e, dWindow)} />
	{/each}

	<button
		style="z-index: 90; display: block;"
		onclick={() =>
			windowManager.createWindow({
				title: "TOP",
				customContainerStyle: "background-color: #aa3355;",
				size: v2,
				alwaysOnTop: true,
				backdropVisible: true,
				content: content,
				props: { text: "New dupa" },
				buttons: [button]
			})}>ADD DUPA</button>
	<button style="z-index: 90; display: block;" onclick={() => (windows[0].props!.text = "Changed...")}
		>Change notif prop woah</button>
	<button style="z-index: 90; display: block;" onclick={() => windowManager.debugAllWindows()}>Big debug button</button>
	<button
		style="z-index: 90; display: block;"
		onclick={() => {
			console.log("Class NONE:", windowManager.getWindowsByClass("NONE"));
			console.log("Class DUPA:", windowManager.getWindowsByClass("DUPA"));
			console.log("Title[] TOP:", windowManager.getWindowsByTitle("TOP"));
			console.log("Title TOP:", windowManager.getFirstWindowByTitle("TOP"));
			console.log("zIndex 4:", windowManager.getWindowByZIndex(4));
			console.log("id 1:", windowManager.getWindowById(1));
			console.log(
				"ANY Predicates:",
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
</main>
