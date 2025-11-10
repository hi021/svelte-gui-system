<script module>
	export { content };
</script>

{#snippet content(/** @type {Record<String, any> | undefined} */ props)}
	<p>
		This is a notif hiii<br />
		{props?.text}
	</p>
{/snippet}
