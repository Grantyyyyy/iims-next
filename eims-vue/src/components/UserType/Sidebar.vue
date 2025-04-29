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
      <!-- <li>
              <a 
                @click="handleLogout" 
                class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer"
              >
                <i class="fas fa-sign-out-alt w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
                <span class="flex-1 ms-3 whitespace-nowrap">Logout</span>
              </a>
      </li> -->
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