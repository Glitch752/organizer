<script lang="ts">
  	import { client } from "./client";

	const title = client.title;
</script>

<header>
	<div class="content-aligned">
		<input
			type="text"
			class="title"
			bind:value={$title}
			aria-label="Title"
			maxlength="100"
		/>
	</div>
</header>

<style lang="scss">
	header {
		grid-column: 1 / -2;
		grid-row: 1 / 2;

		background-color: var(--surface-0);
		padding: 0.5rem;

		border-bottom: 2px solid var(--surface-1-border);
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
		font-weight: normal;

		text-overflow: ellipsis;

		border: none;
		outline: none;
		background-color: transparent;
		color: var(--color-text);

		flex: 1;
	}
</style>
