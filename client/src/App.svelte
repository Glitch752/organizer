<script lang="ts">
	import Header from "./lib/Header.svelte";
	import Nav from "./lib/Nav.svelte";
	import { persistentState } from "./stores/persistent";
	import { route } from "./stores/router";
	import CommandPalette from "./lib/commands/CommandPalette.svelte";

	let navOpen = persistentState<boolean>("navOpen", true);

	function keydown(event: KeyboardEvent) {
		// Ctrl+Shift+E toggles the nav
		if(event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'e') {
			navOpen.set(!$navOpen);
			event.preventDefault();
		}
	}
</script>

<svelte:window onkeydown={keydown} />

<div class="app" class:navOpen={$navOpen}>
	{#if !$route.components.pageOnly}
		<Header bind:navOpen={$navOpen} />
		<Nav />
		<CommandPalette />
	{/if}

	<main
		class:pageOnly={$route.components.pageOnly}
	>
		<!-- svelte-ignore svelte_component_deprecated - <Component/> isn't reactive with a writable for some reason? -->
		<svelte:component this={$route.components.page} />
	</main>
</div>

<style lang="scss">
	.app {
		display: grid;
		grid-template-columns: 1fr 0;
		grid-template-rows: auto 1fr;
		height: 100vh;

		// You can do this... for some reason
		transition: grid-template-columns 200ms ease;
	}

	.app.navOpen {
		grid-template-columns: 1fr var(--nav-width);
	}

	main {
		flex: 1;
		width: 100%;

		grid-column: 1;
		grid-row: 2 / -1;

		overflow-y: auto;

		&.pageOnly {
			grid-column: 1 / -1;
		}
	}
</style>
