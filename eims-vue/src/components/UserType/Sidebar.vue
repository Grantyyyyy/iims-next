<template>
    <div>
      <SuperuserDashboard v-if="userType === 'Superuser'" />
      <SecretarySidebar v-else-if="userType === 'Secretary'" />
      <LabtechSidebar v-else-if="userType === 'Lab Technician'" />
      <AdminSidebar v-else-if="userType === 'Admin'" />
      <StaffDashboard v-else-if="userType === 'Staff'" />
      <IctcSidebar v-else-if="userType === 'ICT Technician'" />
      <DeanSidebar v-else-if="userType === 'Dean'" />
      <SupplySidebar v-else-if="userType === 'Supply Office'" />


      <div v-else>Unknown user type</div>
    </div>
  </template>
  
  <script>
  import { mapGetters } from 'vuex';
  import SuperuserDashboard from './SuperuserDashboard.vue';
  import SecretarySidebar from './SecretarySidebar.vue';
  import LabtechSidebar from './LabtechSidebar.vue';
  import StaffDashboard from './StaffSidebar.vue';
  import AdminSidebar from './AdminSidebar.vue';
  import IctcSidebar from './IctcSidebar.vue';
  import DeanSidebar from './DeanSidebar.vue';
  import SupplySidebar from './SupplySidebar.vue';


  
  export default {
    name: 'Sidebar',
    components: {
      SecretarySidebar,
      StaffDashboard,
      SuperuserDashboard,
      LabtechSidebar,
      AdminSidebar,
      IctcSidebar,
      DeanSidebar,
      SupplySidebar
    },
    computed: {
      ...mapGetters(['userType'])
    },
    methods: {
      handleLogout() {
        this.$store.dispatch('logout');
      }
    }
  }
  </script>


<style scoped>

</style>