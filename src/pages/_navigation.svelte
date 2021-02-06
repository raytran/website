<script>
  import { url, isActive } from "@roxi/routify";
  import {onMount} from "svelte";
  import halfmoon from "halfmoon";
  import Fa from 'svelte-fa';
  import {faMoon} from '@fortawesome/free-solid-svg-icons';
  import {faBars} from '@fortawesome/free-solid-svg-icons';
  let show = false;
  const _links = [
    ["./index", "Home"],
    ["./projects", "Projects"],
    ["./timeline", "Timeline"],
    ["./neat", "Things I Like"]
  ];
  function handleBurger() {
    show = !show;
  }

</script>

<nav class="navbar">
    <!-- Navbar brand -->
    <div class="d-md-none navbar-content dropdown">
        <button class="btn btn-action" data-toggle="dropdown" type="button">
            <Fa icon={faBars}/>
        </button>
        <div class="dropdown-menu">
                {#each _links as [path, name]}
                    <div class="dropdown-item nav-item" class:active={$isActive(path)}>
                        <a class="dropdown-item nav-link"  href={$url(path)}>
                            {name}
                        </a>
                    </div>
                {/each}
        </div>
    </div>

    <a href="/" class="navbar-brand">
        <img src="images/raytran_logo.png" alt="logo">
        raytran.net
    </a>
    <!-- Navbar text
    <span class="navbar-text text-monospace">raytran.net</span> -->
    <!-- Navbar nav -->
    <ul class="navbar-nav d-none d-md-flex"> <!-- d-none = display: none, d-md-flex = display: flex on medium screens and up (width > 768px) -->
        {#each _links as [path, name]}
            <li class="nav-item" class:active={$isActive(path)}>
                <a class="nav-link"  href={$url(path)}>
                    {name}
                </a>
            </li>
        {/each}
    </ul>




    <button class="btn btn-action ml-auto" aria-label="Toggle dark mode" type="button" on:click={()=>{halfmoon.toggleDarkMode()}}>
        <Fa icon={faMoon}/>
    </button>



</nav>
