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

      .center-cropped {
	object-fit: cover; 
	object-position: center;
	width: 100%;
	height: 100%;
	border-radius: 5px;
      }

      .thumbnail, .summary {
	width: 100%;
      }

      .square {
  	width: 100%;
  	height: 0;
	position: relative;
  	padding-top: 100%;
      }

      .square > div {
          position: absolute;
	  top:0;
	  left:0;
	  width: 100%;
	  height: 100%;

      }

      .content {
          display: flex;
	  flex-direction: column;
          padding-top: 1rem;
	  padding-bottom: 0.5rem;
      }

      @media (min-width:500px) {
	  .thumbnail {
	      margin-right: 1rem;
	  }
          .content {
	      flex-direction: row;
	  }

      }
</style>
<Card>
    {meta.frontmatter.published}
    <br>
    <a class="title" href={path}>{meta.frontmatter.title}</a>
    <div class="content">
	<div class="thumbnail">
	    <div class="square">
	    <div>
	    <img class="center-cropped" src={'/images/' + meta.frontmatter.thumbnail } alt="thumbnail">
	    </div>
	    </div>
	</div>
	<div class="summary">
	    {@html marked(meta.frontmatter.summary)}
	</div>
    </div>
    {#each meta.tags as tag}
	<span on:click={dispatch('tagclick', tag)} class={activeTags.includes(tag) ? "tag active" : "tag"}>{tag}</span>
    {/each}
</Card>
