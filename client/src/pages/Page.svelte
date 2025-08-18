<script lang="ts">
    import { route } from "../stores/router";

    // lmao
    let [id] = $derived([route.matches?.at(0), $route]);
</script>

<p>Page {id}</p>