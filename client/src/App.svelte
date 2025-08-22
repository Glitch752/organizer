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
		height: 100vh;
	}

	main {
		flex: 1;
		width: 100%;

		grid-column: 1;
		grid-row: 2 / -1;

		overflow-y: auto;
	}
</style>
