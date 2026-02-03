<script lang="ts">
	import type { Attachment } from 'svelte/attachments';

	const onClickOutside: Attachment = (node) => {
		window.addEventListener('click', handleClick);

		function handleClick(e: MouseEvent) {
			if (!e.composedPath().includes(e.target!)) node.dispatchEvent(new CustomEvent('outsideclick'));
		}

		return () => window.removeEventListener('click', handleClick);
	};
</script>
