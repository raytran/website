<link
        rel="stylesheet"
        href="https://unpkg.com/github-calendar@latest/dist/github-calendar-responsive.css"
/>
<script>
    import {url, layout} from "@roxi/routify";
    import {onMount} from 'svelte';
    import GithubCalendar from "github-calendar";
    import PreviewCard from "../../components/PreviewCard.svelte"

    const posts = $layout.children
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
        .sort((a, b) => b.meta["frontmatter"].published.localeCompare(a.meta["frontmatter"].published));


    console.log(posts)
    let calendar;
    onMount(async () => {
        GithubCalendar(calendar, "raytran", {responsive: true, tooltips: true})
    });

</script>


<style>
    #ghcalendar {
        max-width: 60rem;
    }
    #description {
        background: white;
        padding: 1rem;
    }
    #postWrapper {
        display: flex;
        flex-direction: column;
    }
    .post{
        margin-top:1em;
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
<div id="postWrapper">
    {#each posts as {meta, path}}
        <div class="post">
            <PreviewCard {meta} {path}/>
        </div>
    {/each}
</div>
