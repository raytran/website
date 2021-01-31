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
  #main_wrapper{
  	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
  }

  #center_wrapper{
  	display:flex;
  	justify-content: center;
  	width: 100%;
  }

  #outer_wrapper{
	max-width: 700px;
  }
  #intro{
	max-width: 400px;
  	font-size: 1.5rem;
  
  }
  #logo{
      width: 100%;
      margin-bottom: 0.5rem;

  }

  #icon-links{
	margin-top: 0.5rem;
  	display: flex;
	flex-direction: row;
	justify-content: space-between;
  }


  @media (min-width: 350px) {
	#logo{
		max-width: 290px;
	}

	#icon-links{
	    justify-content: left;
	}

	.icon {
	    margin-right: 1.2rem;
	}


  }

  @media (min-width: 550px){
  	#main_wrapper{
		flex-direction: row;
  	}
	#logo{
		margin-right: 1.5rem;
	}
  }


  /*
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
    width: 100%;
    padding: 1rem;
  }
  .icon > a {
    color: black;
  }
  .icon{
    padding-right: 1rem;
  }
  #icon-links{
    margin-top: 1rem;
    justify-content: left;
    display: flex;
  }
  */

</style>


<div id="center_wrapper">
<div id="outer_wrapper">
<Card>
  <div id="main_wrapper">
    <img id="logo" alt="raytran-logo" src="/images/raytran_logo.png">
    <div id="intro">

      <div>
	Hi, my name is <b>Raymond Tran</b>.<br>
	I'm a sophomore at MIT majoring in Electrical Engineering & Computer Science.
	Here is my <a style="color:blue" href="https://drive.google.com/file/d/1ZYyUQ5egN5oHIuxHjoMIhimj27dHf3Nf/view?usp=sharing">resume</a>.
      </div>
      <div id="icon-links">
	<div class="icon">
	  <a href="https://github.com/raytran">
	    <Fa size="2x" icon={faGithub}/>
	  </a>
	</div>
	<div class="icon">
	  <a href="https://instagram.com/rayt.ran">
	    <Fa size="2x" icon={faInstagram}/>
	  </a>
	</div>
	<div class="icon">
	  <a href="https://www.facebook.com/raymond.tran.3158/">
	    <Fa size="2x" icon={faFacebook}/>
	  </a>
	</div>
	<div class="icon">
	  <a href="https://www.linkedin.com/in/raymondtran120/">
	    <Fa size="2x" icon={faLinkedin}/>
	  </a>
	</div>
      </div>
    </div>
  </div>
</Card>


</div>
</div>
