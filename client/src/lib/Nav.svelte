<script lang="ts">
    import { persistentState } from "../stores/persistent";
  	import { route } from "../stores/router";

    let latestPage = persistentState<string | null>("latestPage", null);
    $effect(() => {
        if($route.onRoute("page")) {
            latestPage.set($route.matches?.[1] ?? null);
        }
    })

</script>

<nav>
    <div class="header">
        <button class="blue" class:active={$route.onRoute("home")} onclick={() => route.navigate("/home")}>Home</button>
        <button class="blue" class:active={$route.onRoute("page")} onclick={() => route.navigate($latestPage ? `/page/${$latestPage}` : "/home")}>Notes</button>
        <button class="blue" class:active={$route.onRoute("calendar")} onclick={() => route.navigate("/calendar")}>Calendar</button>
    </div>

    <!-- svelte-ignore svelte_component_deprecated - <Component/> isn't reactive with a writable for some reason? -->
    <svelte:component this={$route.components?.nav} />
</nav>

<style lang="scss">
    nav {
        grid-column: -2 / -1;
        grid-row: 1 / -1;

        background-color: var(--surface-0);

		border-left: 2px solid var(--surface-1-border);

        display: flex;
        flex-direction: column;

        margin: 0;

        width: var(--nav-width);
    }

    .header {
        padding: 0.5rem;

        display: flex;
        flex-direction: row;
        gap: 0.5rem;

        > button {
            text-align: left;
            padding: 0.25rem 0.5rem;
        }
    }

    @media (max-width: 700px) {
        nav {
            z-index: 100;
            box-shadow: 2px 0 8px rgba(0,0,0,0.2);
            transform: translateX(calc(var(--nav-width) * -1));
            transition: transform 200ms ease;
            grid-row: 2 / -1;
        }

        :global(.navOpen) {
            nav {
                transform: translateX(0);
            }
        }
    }
</style>