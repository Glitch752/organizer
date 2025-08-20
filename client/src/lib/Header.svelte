<script lang="ts">
</script>

<header>
	<div class="content-aligned">
		<h1 contenteditable>Test title</h1>
	</div>
</header>

<style lang="scss">
	header {
		display: grid;
		flex-direction: column;
		justify-content: space-between;

		grid-template-columns: subgrid;

		grid-column: 1 / -2;
		grid-row: 1 / 2;

		background-color: var(--surface-0);
		padding: 0.5rem;

		border-bottom: 2px solid var(--surface-1-border);
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: normal;
	}

	.content-aligned {
		grid-column: 2;
	}
</style>
