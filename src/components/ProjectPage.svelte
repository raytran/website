
<script>
    import Card from "./Card.svelte";
</script>
<Card>
    <a href="/projects">
        <button class="btn btn-danger" type="button">
            Back to All Projects
        </button>
    </a>
    <slot/>
    <a href="/projects">
        <button class="btn btn-danger" type="button">
            Back to All Projects
        </button>
    </a>
</Card>
