<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	import marked from "marked";
	export let meta;
	export let path;
	export let activeTags;
</script>

<style>
	.center-cropped {
		object-fit: cover;
		object-position: center;
		width: 100%;
		height: 100%;
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

	@media (min-width:500px) {
		.thumbnail {
			margin-right: 1rem;
		}
	}

</style>
<div class="card p-0 m-0 d-flex flex-column justify-content-between overflow-hidden">
	<div>
		<a href={path}>
			<div class="rounded-top thumbnail">
				<div class="square">
					<div>
						<a href={path}>
							<img class="center-cropped" src={meta.frontmatter.thumbnail } alt="thumbnail">
						</a>
					</div>
				</div>
			</div>
		</a>

		<!-- Nested content container inside card -->
		<div class="content">
			<a href={path}>
				<h2 class="content-title">
					{meta.frontmatter.title}
				</h2>
			</a>
			<p class="text-muted">
				{@html marked(meta.frontmatter.summary)}
			</p>
		</div>

	</div>
	<div class="px-card py-10 bg-light-lm bg-very-dark-dm rounded-bottom"> <!-- py-10 = padding-top: 1rem (10px) and padding-bottom: 1rem (10px), bg-light-lm = background-color: var(--gray-color-light) only in light mode, bg-very-dark-dm = background-color: var(--dark-color-dark) only in dark mode, rounded-bottom = rounded corners on the bottom -->
		<p class="font-size-12 m-0"> <!-- font-size-12 = font-size: 1.2rem (12px), m-0 = margin: 0 -->
			Tags:
			{#each meta.tags as tag}
			<span on:click={dispatch('tagclick', tag)} class:badge-primary={activeTags.includes(tag)}
				  style="cursor:pointer; margin:2px" class="badge badge-primary active">{tag}</span>
			{/each}
		</p>
	</div>
</div>

