<link
        rel="stylesheet"
        href="https://unpkg.com/github-calendar@latest/dist/github-calendar-responsive.css"
/>
<script>
    import {url, layout} from "@roxi/routify";
    import {onMount} from 'svelte';
    import GithubCalendar from "github-calendar";
    import PreviewCard from "../../components/PreviewCard.svelte"

    let activeTags = []
    let posts;

    function filterPosts(tags) {
        posts = $layout.children
            .filter((c) => c.meta["frontmatter"])
            .map((c) => {
                let tags = [];
                if (c.meta['frontmatter']['tags']) {
                    tags = c.meta['frontmatter']['tags'].split(',').map(str => str.trim());
                }
                tags = tags.sort();
                c.meta['tags'] = tags;
                return c;
            })
            .filter((c) => {
                let intersection = c.meta['tags'].filter(v => tags.includes(v))
                return tags.length === 0 || intersection.length === tags.length;
            })
            .sort((a, b) => b.meta["frontmatter"].published.localeCompare(a.meta["frontmatter"].published));
    }
    filterPosts(activeTags)

    let calendar;
    onMount(async () => {
        GithubCalendar(calendar, "raytran", {responsive: true, tooltips: true})
    });

</script>


<style>
    #ghcalendar {
        max-width: 60rem;
    }
    #tagselect, #description {
        background: white;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    #postWrapper {
        display: flex;
        flex-direction: column;
    }
    .post{
        margin-bottom: 1em;
        width: 100%;
    }
</style>
<div id="description">
    <h1>Projects</h1>
    <p>
        Here are some of the projects that I've done.
    </p>
    <div id="ghcalendar" bind:this={calendar}>A github calendar should be loading..</div>
</div>
<div id="tagselect">
    Active tags:
    {#each activeTags as tag}
        <span on:click={e =>{
            console.log(e)
            activeTags = activeTags.filter(x => x !== e.target.textContent).sort()
            filterPosts(activeTags);
        }} class="active tag">{tag}</span>
    {/each}
</div>
<div id="postWrapper">
    {#each posts as {meta, path}}
        <div class="post"gs = >
            <PreviewCard on:tagclick={e => {
                if (!activeTags.includes(e.detail))
                    activeTags = [...activeTags, e.detail].sort();
                else
                    activeTags = activeTags.filter(x => x !== e.detail).sort();
                filterPosts(activeTags);
            }} {meta} {path} {activeTags}/>
        </div>
    {/each}
</div>
