<!-- routify:options index=10 -->
<!-- routify:options title="home" -->
<script>
  import Fa from 'svelte-fa';
  import Card from "../components/Card.svelte";
  import {faInstagram} from '@fortawesome/free-brands-svg-icons';
  import {faFacebook} from '@fortawesome/free-brands-svg-icons';
  import {faLinkedin} from '@fortawesome/free-brands-svg-icons';
  import {faGithub} from '@fortawesome/free-brands-svg-icons';
</script>
<style>
  #main_wrapper {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    padding: 1rem;
    align-items: center;
    overflow: auto;
  }
  #intro{
    display: flex;
    flex-direction: column;
    font-size: 3rem;
    width: 30rem;
    padding: 1rem;
  }
  #logo{
    display: inline-block;
    width: 22rem;
    height: 22rem;
    padding: 1rem;
  }
  .icon > a {
    color: black;
  }
  .icon{
    padding-right: 1rem;
  }
  #logo-links{
    justify-content: left;
    display: flex;
  }
</style>

<Card>

  <div id="main_wrapper">
    <img id="logo" alt="raytran-logo" src="/images/raytran_logo.png">
    <div id="intro">
      <div>
        Hi, my name is <b>Raymond Tran</b>.<br>
        I'm a sophmore at MIT majoring in Electrical Engineering & Computer Science.
        Here is my <a style="color:blue" href="https://drive.google.com/file/d/1ZYyUQ5egN5oHIuxHjoMIhimj27dHf3Nf/view?usp=sharing">resume</a>.
      </div>
      <div id="logo-links">
        <div class="icon">
          <a href="https://github.com/raytran">
            <Fa icon={faGithub}/>
          </a>
        </div>
        <div class="icon">
          <a href="https://instagram.com/rayt.ran">
            <Fa icon={faInstagram}/>
          </a>
        </div>
        <div class="icon">
          <a href="https://www.facebook.com/raymond.tran.3158/">
            <Fa icon={faFacebook}/>
          </a>
        </div>
        <div class="icon">
          <a href="https://www.linkedin.com/in/raymondtran120/">
            <Fa icon={faLinkedin}/>
          </a>
        </div>
      </div>
    </div>
  </div>


</Card>
