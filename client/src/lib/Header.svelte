<script lang="ts">
  	import { route } from "../stores/router";
  	import { client } from "./client";

	const title = client.title;
	const [onPage] = $derived([route.onRoute("page"), $route]);

	function capitalize(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
</script>

<header>
	{#if onPage}
		<div class="content-aligned">
			<input
				type="text"
				class="title"
				bind:value={$title}
				aria-label="Title"
				maxlength="100"
			/>
		</div>
	{:else}
		<h2>{capitalize(route.currentRoute ?? "")}</h2>
	{/if}
</header>

<style lang="scss">
	header {
		grid-column: 1 / -2;
		grid-row: 1 / 2;

		background-color: var(--surface-0);
		padding: 0.5rem;
		height: 3rem;

		border-bottom: 2px solid var(--surface-1-border);
	}

	h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: normal;

		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;

		color: var(--color-text);
	}

	.content-aligned {
		display: flex;
		flex-direction: row;

		margin: 0 auto;
		padding: 0 1rem;
		max-width: var(--max-content-width);
	}

	.title {
		margin: 0;
		font-size: 1.5rem;
		padding: 0;
		font-weight: normal;

		text-overflow: ellipsis;

		border: none;
		outline: none;
		background-color: transparent;
		color: var(--color-text);

		flex: 1;
	}
</style>
