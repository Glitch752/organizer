<script lang="ts">
  	import { route } from "../stores/router";

	let { navOpen = $bindable() }: {
		navOpen: boolean
	} = $props();
	
	function capitalize(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	function openPalette(text: string = "") {
		// TODO
	}
</script>

<!-- This is a gross mess of nested flexboxes, but it works -->
<header>
	<div class="left"></div>
	<div class="content-aligned" class:onPage={$route.onRoute("page")}>
		{#if $route.components.header}
			<!-- svelte-ignore svelte_component_deprecated - <Component/> isn't reactive with a writable for some reason? -->
			<svelte:component this={$route.components.header} />
		{:else}
			<h2>{capitalize($route.routeName ?? "")}</h2>
		{/if}

		<div class="actions">
			<button onclick={() => openPalette("")} aria-label="Open page" title="Open page">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="humbleicons hi-book"><g xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-linejoin="round" stroke-width="2"><path d="M18 16V4H8a2 2 0 00-2 2v12"/><path d="M18 20H8a2 2 0 110-4h10c-.673 1.613-.66 2.488 0 4z"/></g></svg>
			</button>
			<button onclick={() => openPalette(">")} aria-label="Run command" title="Run command">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="humbleicons hi-code"><g xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-linecap="round" stroke-width="2"><path stroke-linejoin="round" d="M7 8l-4 4 4 4"/><path d="M10.5 18l3-12"/><path stroke-linejoin="round" d="M17 8l4 4-4 4"/></g></svg>
			</button>
		</div>
	</div>
	<div class="right">
		<button 
			class="nav-toggle"
			onclick={() => navOpen = !navOpen}
			aria-label={navOpen ? "Hide navigation" : "Show navigation"}
		>
			{navOpen ? "→" : "←"}
		</button>
	</div>
</header>

<style lang="scss">
	header {
		grid-column: 1 / -2;
		grid-row: 1 / 2;

		background-color: var(--surface-0);
		padding: 0.5rem;
		height: 3rem;

		border-bottom: 2px solid var(--surface-1-border);
		
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;

		button {
			width: 2rem;
			height: 2rem;
			display: grid;
			place-items: center;
			padding: 0;

			> svg {
				width: 1.5rem;
				height: 1.5rem;
				color: var(--color-important-text);
			}
		}
	}

	h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: normal;

		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;

		color: var(--color-text);
		flex: 1;
	}

	.left, .right {
		flex: 1;
		display: flex;
		flex-direction: row;
	}
	.right {
		justify-content: flex-end;
	}
	
	.content-aligned {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		
		// Yay for magic numbers
		&.onPage {
			max-width: calc(var(--max-content-width) - 1.5rem);
			padding: 0 0.5rem;
		}

		flex: 99999;
		// background-color: red;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.nav-toggle {
		justify-self: flex-end;
		
		background: var(--surface-1);
		border: 1px solid var(--surface-1-border);
		color: var(--color-text);
		
		border-radius: 0.25rem;
		
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		
		&:hover {
			background: var(--surface-2);
		}
	}
</style>
