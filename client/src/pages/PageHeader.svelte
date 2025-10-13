<script lang="ts">
  	import { client } from "../lib/client";
	const title = client.title;
</script>

<input
    type="text"
    class="title"
    bind:value={$title}
    aria-label="Title"
    maxlength="100"
/>

<style>
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

		width: 50%;
		flex: 1;
	}
</style>