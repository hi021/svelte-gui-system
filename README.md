# svelte-gui-system

**very** WIP\
An extensible Svelte 5 library for programmatically creating dynamic GUIs with floating windows, audio controls, events, and related UI utilities.

## install

Build the library, then add the local package from a consuming project (for now):

```sh
pnpm build
cd ../consuming-project
pnpm add ../svelte-gui-system
```

## usage

Use the library from a Svelte 5 project with its default Svelte + Vite setup. The package ships declarations generated from its Svelte components:

```ts
// vite.config.ts
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({ plugins: [svelte()] });
```

You can set up TypeScript (6.x for now) to use bundler resolution and lint using `svelte-check`:

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

Import the stylesheet explicitly (for now), then use the exported classes and templates:

```svelte
<script lang="ts">
	import { Icon, NotificationTemplate } from 'svelte-gui-system';
</script>

<Icon tag="window-close" />
{@render NotificationTemplate({ text: 'Ready' })}
```

```ts
import 'svelte-gui-system/styles.css';
```

---

Made with 💜 and LLMs for the boring parts
