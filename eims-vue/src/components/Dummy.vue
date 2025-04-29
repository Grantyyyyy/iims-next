<template>
  <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-header">
      <h1 v-if="!isCollapsed" class="eims-title">EIMS</h1>
      <button @click="toggleSidebar" class="toggle-btn">
        <i :class="isCollapsed ? 'fas fa-bars' : 'fas fa-times'"></i>
      </button>
    </div>
    <nav>
      <ul>
        <li>
          <a href="#"><i class="fas fa-chart-line"></i> <span>Dashboard</span></a>
        </li>
        <li>
          <a href="#"><i class="fas fa-box-open"></i> <span>Items</span></a>
        </li>
        <li>
          <a href="#" @click.prevent="toggleDropdown">
            <i class="fas fa-briefcase"></i> 
            <span>Transactions</span>
            <i class="fa-solid fa-caret-down" :class="{ 'down': isDropdownOpen }"></i>
          </a>
          <ul v-if="isDropdownOpen" class="submenu">
            <li><a href="#">Borrow Items</a></li>
            <li><a href="#">List of Borrowed Items</a></li>
            <li><a href="#">List of Returned Items</a></li>
          </ul>
        </li>
        <li>
          <a href="#" @click.prevent="logout"><i class="fas fa-sign-out-alt"></i> <span>Logout</span></a>
        </li>
      </ul>
    </nav>
  </div>

</template>
  
<script>
import { computed } from 'vue'
import { useStore } from 'vuex'


export default {
  name: 'Sidebar',
  components: {

  },
  data() {
    return {
      isCollapsed: false,
      isDropdownOpen: false
    }
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
      if (this.isCollapsed) {
        this.isDropdownOpen = false;
      }
    },
    toggleDropdown() {
      if (!this.isCollapsed) {
        this.isDropdownOpen = !this.isDropdownOpen;
      }
    }
  },
  setup() {
    const store = useStore()
    const logout = async () => {
        store.dispatch('logout')
      }

    return {
      logout
    }
  }
}
</script>
  
<style >
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 250px;
  height: 100vh;
  background-color: #2B2F3A;
  color: #FFFFFF;
  transition: width 0.3s;
  overflow-x: hidden;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.eims-title {
  font-size: 1.5rem;
  margin: 0;
}

.toggle-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #FFFFFF;
}

nav ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

nav ul li {
  padding: 0.5rem 1rem;
}

nav ul li a {
  text-decoration: none;
  color: #FFFFFF;
  display: flex;
  align-items: center;
}

nav ul li a i {
  margin-right: 1rem;
  min-width: 20px; /* Ensure a consistent space for the icons */
  text-align: center; /* Center the icon */
}

nav ul li a span {
  flex-grow: 1; /* Allow the text to take up the remaining space */
  text-align: left;
}

.arrow {
  margin-left: auto;
  transition: transform 0.3s;
}

.arrow.down {
  transform: rotate(90deg);
}

.submenu {
  padding-left: 2.5rem; /* Add padding to align submenu items */
}

.collapsed .eims-title,
.collapsed nav ul li a span,
.collapsed .submenu {
  display: none;
}

.collapsed nav ul li a {
  justify-content: center;
}

span {
  text-align: left;
}
</style>
