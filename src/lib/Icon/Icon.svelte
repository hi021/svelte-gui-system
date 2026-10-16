<script lang="ts">
	import { iconController } from './IconController';
	import { IconType } from './IconType';

	let {
		tag,
		svg,
		color,
		styleClasses = '',
		style = ''
	}: {
		tag?: string;
		svg?: string;
		color?: string;
		styleClasses?: string;
		style?: string;
	} = $props();

	let renderedSvg = $state('');

	$effect(() => {
		const directSvg = svg;
		const source =
			directSvg !== undefined ? { type: IconType.SVG, value: directSvg }
			: tag ? iconController.getIcon(tag)
			: undefined;

		if (!source) {
			renderedSvg = '';
			return;
		}

		let active = true;
		iconController.resolveSource(source).then(
			(value) => {
				if (active) renderedSvg = value;
			},
			(error: unknown) => {
				if (!active) return;
				renderedSvg = '';
				console.error(error);
			}
		);

		return () => {
			active = false;
		};
	});
</script>

<span class="icon {styleClasses}" style="{color ? `color: ${color};` : ''} {style}" aria-hidden="true">
	{@html renderedSvg}
</span>

<style>
	.icon {
		display: inline-flex;
		width: 1em;
		height: 1em;
		align-items: center;
		justify-content: center;
		color: inherit;
	}

	.icon :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
		fill: currentColor;
	}
</style>
