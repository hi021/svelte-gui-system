<script module>
	export { content };
</script>

{#snippet content(/** @type {Record<String, any> | undefined} */ props)}
	<p>
		{props?.text}
	</p>
{/snippet}
