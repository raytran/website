<script>
  import { Router } from "@roxi/routify";
  import { routes } from "../.routify/routes";
  import {onMount} from "svelte";
  import halfmoon from "halfmoon";

  onMount(()=>{
      halfmoon.onDOMContentLoaded();
  })
</script>

<style global>
  @import "../static/global.css";
  @import "../static/blog.pcss";
  @import "https://cdnjs.cloudflare.com/ajax/libs/prism/1.20.0/themes/prism-okaidia.min.css";
  @import "halfmoon/css/halfmoon-variables.min.css";
  @import "../static/halfmoon-variable-override.css";
</style>

<Router {routes} />
