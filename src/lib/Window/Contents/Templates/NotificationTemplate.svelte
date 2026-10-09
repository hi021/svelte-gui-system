<script module lang="ts">
	export { content };
</script>

{#snippet content(props?: { text: string })}
	<p>
		{props?.text}
	</p>
{/snippet}
