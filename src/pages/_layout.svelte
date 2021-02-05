<script>
  import { metatags, page } from "@roxi/routify";
  import Navigation from "./_navigation.svelte";

  $: metatags.title = `raytran.net - ${$page.title}`;
  metatags.description = "Raymond Tran's personal website";
</script>

<div>
  <Navigation />
  <slot />
</div>

