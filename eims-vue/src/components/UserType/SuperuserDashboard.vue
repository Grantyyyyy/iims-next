<template>
    <Dummy/>

</template>
  

  <script>
  import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'SuperuserDashboard',
  components: {
  },
  setup() {
    const store = useStore()

    const user = computed(() => store.getters.user)
    const userType = computed(() => store.getters.userType)

    const logout = async () => {
        store.dispatch('logout')
        
      }

    return {
      user,
      userType,
      logout
    }
  }
}
  </script>
  
