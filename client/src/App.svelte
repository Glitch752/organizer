<script lang="ts">
	import Header from "./lib/Header.svelte";
	import Nav from "./lib/Nav.svelte";
  	import { route } from "./stores/router";

	let component = route.component;
</script>

<div class="app">
	<Header />
	<Nav />

	<main>
		<!-- svelte-ignore svelte_component_deprecated - <Component/> isn't reactive with a writable for some reason? -->
		<svelte:component this={$component} />
	</main>
</div>

<style>
	.app {
		display: grid;
		grid-template-columns: 1fr 24rem;
		grid-template-rows: auto 1fr;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;

		grid-column: 1;
		grid-row: 2 / -1;
	}
</style>
