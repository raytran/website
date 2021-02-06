<link
        rel="stylesheet"
        href="https://unpkg.com/github-calendar@latest/dist/github-calendar-responsive.css"
/>

<script>
    import {url, layout} from "@roxi/routify";
    import {onMount} from 'svelte';
    import GithubCalendar from "github-calendar";
    import PreviewCard from "../../components/PreviewCard.svelte";
    import Heap from "heap";


    let activeTags = []
    let posts;


    let tagFrequency = {}

    function filterPosts(tags) {
        posts = $layout.children
            .filter((c) => c.meta["frontmatter"])
            .map((c) => {
                let tags = [];
                if (c.meta['frontmatter']['tags']) {
                    tags = c.meta['frontmatter']['tags'].split(',').map(str => str.trim());
                }
                tags = tags.sort();

                for (let t of tags){
                    if (tagFrequency[t] == null){
                        tagFrequency[t] = 0;
                    }
                    tagFrequency[t] += 1;
                }
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

    let topTags = [];
    let heap = new Heap(function(a, b){
        return a.freq - b.freq;
    });
    for (let o in tagFrequency){
        heap.push({tag: o, freq: -tagFrequency[o]});
    }

    for (let i=0; i<5;i++){
        let item = heap.pop();
        if (item === undefined) break;
        topTags = [...topTags, item.tag];
    }






    /*
    let calendar;
    onMount(async () => {
        console.log(calendar)
        GithubCalendar(calendar, "raytran", {responsive: true, tooltips: true})
    });
     */

    function toggleTag(tag){
        if (!activeTags.includes(tag))
            activeTags = [...activeTags, tag].sort();
        else
            activeTags = activeTags.filter(x => x !== tag).sort();
        filterPosts(activeTags);
    }

    function disableTag(tag){
        activeTags = activeTags.filter(x => x !== tag).sort()
        filterPosts(activeTags);
    }

</script>
<style>
    #preview-holder {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        /* This is better for small screens, once min() is better supported */
        /* grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr)); */
        grid-gap: 1.2rem;
        /* This is the standardized property now, but has slightly less support */
        /* gap: 1rem */
    }
</style>
<div class="card">
    <h1>Projects</h1>
    <p>
        Here are some of the projects that I've done, both for fun and for school.
        <br>
        <a class="hyperlink" href="https://github.com/raytran">You can also see some of my github repos here.</a>
    </p>

    <img alt="github stats" class="img-fluid" style="width: 100%" src="https://grass-graph.moshimo.works/images/raytran.png">
</div>
<!--
<div bind:this={calendar}>A github calendar should be loading..</div>
-->
<div class="card my-0">

    Popular Tags:
    {#each topTags as tag}
        <span on:click={e => toggleTag(e.target.textContent)} style="cursor:pointer; margin:2px" class="badge">{tag}</span>
    {/each}

    <hr>
    Active tags:
    {#each activeTags as tag}
        <span on:click={e => toggleTag(e.target.textContent)} style="cursor:pointer; margin:2px" class="badge badge-primary">{tag}</span>
    {/each}
</div>
<div class="p-card" id="preview-holder">
    {#each posts as {meta, path}}
        <PreviewCard on:tagclick={e=>toggleTag(e.detail)} {meta} {path} {activeTags}/>
    {/each}
</div>
