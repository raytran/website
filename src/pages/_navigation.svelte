<script>
  import { url, isActive } from "@roxi/routify";
  let show = false;
  const _links = [
    ["./index", "Home"],
    ["./projects", "Projects"],
    ["./timeline", "Timeline"],
  ];
  function handleBurger() {
    show = !show;
  }
</script>

<style>
  aside {
    text-align: center;
  }
  nav {
    background: white;
  }
  .link {
    display: block;
    font-size: 1.2rem;
    white-space: nowrap;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .active {
    font-weight: bold;
  }
  .mobile-nav {
    font-size: 1rem;
    background: white;
    padding: 1rem;
    box-shadow: 0px 5px 20px 5px rgba(0, 0, 0, 0.075);
    display: flex;
    justify-content: space-between;
  }
  .mobile-nav * {
    vertical-align: middle;
  }
  .title {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .burger {
    font-size: 1rem;
  }
  nav {
    display: none;
    padding: 1rem;
    z-index: 1;
  }
  @media (min-width: 640px) {
    nav {
      margin: 16px;
      border-radius: 4px;
      box-shadow: 0px 5px 20px 5px rgba(0, 0, 0, 0.075);
      display: inline-block;
      position: relative;
      width: auto;
    }
    .link {
      padding: 0 16px;
      min-width: 56px;
      display: inline-block;
    }
    .mobile-nav {
      display: none;
    }
  }
  nav.show {
    display: block;
  }
</style>

<aside>
  <nav class="mobile-nav">
    <div class="burger" on:click={handleBurger}>☰</div>
    <div class="title">raytran.dev</div>
    <div />
  </nav>
  <nav class:show on:click={() => (show = false)}>
    {#each _links as [path, name]}
      <a class="link" class:active={$isActive(path)} href={$url(path)}>
        {name}
      </a>
    {/each}
  </nav>
</aside>
