<script>
    import { username } from "../connection";
</script>
<!-- TODO: use username lol -->
<main>
    <p>Welcome back, <span class="accent">{$username}</span>!</p>
    
    <p>Version: {__APP_VERSION__}</p>
    <p>Git SHA: {__GIT_COMMIT_HASH__}</p>
</main>

<style>
main {
    padding: 1rem;
}
p {
    margin: 0.5rem 0;
}
.accent {
    color: var(--blue-text);
}
</style>