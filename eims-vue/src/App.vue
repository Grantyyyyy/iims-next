<template>
  <router-view/>
</template>

<script>
// import LoginView from './components/LoginView.vue'
import LandingPage from './views/LandingPage.vue';



export default {
  name: 'App',
  components: {
    LandingPage
  }
}

</script >


<style >
#app {
  font-family: 'Inter', sans-serif;
  /* text-align: center; */
  height: 100%;
  background-image: linear-gradient(#F5F4F1, #D4EAF7);
  /* display: flex; */
  /* justify-content: center;
  align-items: center; */
}


html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

</style>
