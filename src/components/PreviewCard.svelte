<script>
    import { createEventDispatcher } from 'svelte';
    import Card from "./Card.svelte";

    const dispatch = createEventDispatcher();

    import marked from "marked";
    export let meta;
    export let path;
    export let activeTags;
</script>

<style>
    .title {
        font-size: 2em;
    }
    .thumbnail {
        width: 15rem;
    }
</style>
<Card>
    {meta.frontmatter.published}
    <div style="display: flex; justify-content: space-between;">
        <div>
            <a class="title" href={path}>{meta.frontmatter.title}</a>
            {@html marked(meta.frontmatter.summary)}
        </div>
        <img class="thumbnail" src={'/images/' + meta.frontmatter.thumbnail } alt="thumbnail">
    </div>
    {#each meta.tags as tag}
        <span on:click={dispatch('tagclick', tag)} class={activeTags.includes(tag) ? "tag active" : "tag"}>{tag}</span>
    {/each}
</Card>
