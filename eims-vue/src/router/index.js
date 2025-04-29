import { createRouter, createWebHistory } from 'vue-router';
import GlobalCart from '@/views/Ictc/Modals/GlobalCart.vue';
import store from '../store';
import LoginView from '../components/LoginView.vue';
import Sidebar from '../components/UserType/Sidebar.vue';
import ChemicalList from '@/views/Labtech/ChemicalList.vue'
import ProfileView from '@/views/ProfileView.vue'

import ChemicalDetails from '@/views/Labtech/ChemicalDetail.vue'
import ChemicalUpdateForm from '@/views/Labtech/ChemicalUpdateForm.vue'



import RoomList from '@/views/Admin/RoomList.vue';
import UserList from '@/views/Admin/UserList.vue';


import LandingPage from '@/views/Secretary/LandingPage.vue';

import BarcodeScanner from '@/components/BarcodeScanner.vue';

import BorrowedEquipment from '@/views/Labtech/BorrowedEquipment.vue'
import LabtechDashboard from '@/views/Labtech/LabtechDashboard.vue'
import ItemBorrow from '@/views/Secretary/ItemBorrow.vue';
import StaffBorrowedList from '@/views/Dean/StaffBorrowedList.vue';

// ICTC



const routes = [

  { path: '/borrowed', name: 'borrowed', component: () => import('@/views/Dean/AllBorrowed.vue'), meta: { requiresAuth: true } },
  { path: '/returned', name: 'returned', component: () => import('@/views/Dean/AllReturned.vue'), meta: { requiresAuth: true } },

  { path: '/landing-page', name: 'landing', component: () => import('@/views/LandingPage.vue') },

  { path: '/department', name: 'department-list', component: () => import('@/views/Admin/DepartmentList.vue') },

  { path: '/test', name: 'test', component: () => import('@/views/Secretary/Test.vue') },

//LABTECH
  { path: '/labtech-category', name: 'labtech-category', component: () => import('@/views/Labtech/LabtechCategory.vue'), meta: { requiresAuth: true, allowedUserTypes: ['Dean', 'Lab Technician'] } },
  { path: '/labtech-category/:id/instances', name: 'labtech-category-instances', component: () => import('@/views/Labtech/LabtechCategoryInstances.vue'), props: true, meta: { requiresAuth: true, allowedUserTypes: ['Dean', 'Lab Technician'] } },
  { path: '/subjects', name: 'subject-list', component: () => import('@/views/Labtech/SubjectList.vue') },

  { path: '/labtech-dashboard', name: 'labtech-dashboard', component: () => import('@/views/Labtech/LabtechDashboard.vue'), meta: { requiresAuth: true } },
  { path: '/borrowed-equipments', name: 'borrowed-equipment', component: () => import('@/views/Labtech/BorrowedEquipment.vue'), meta: { requiresAuth: true } },
  { path: '/assigned-equipments', name: 'assigned-equipments', component: () => import('@/views/Supply/AssignedEquipment.vue'), meta: { requiresAuth: true, allowedUserTypes: [ 'Supply Office'] } },

  { path: '/apparatus', name: 'apparatus-list', component: () => import('@/views/Labtech/ApparatusList.vue'), meta: { requiresAuth: true } },
  { path: '/apparatus/:apId/instances/', name: 'apparatus-instances', component: () => import('@/views/Labtech/ApparatusInstances.vue'), props: true, meta: { requiresAuth: true } },
  { path: '/apparatus/:apId/detail', name: 'apparatus-detail', component: () => import('@/views/Labtech/ApparatusInstancesDetail.vue'), props: true },

  { path: '/borrowed-apparatus', name: 'borrowed-apparatus', component: () => import('@/views/Labtech/BorrowedApparatus.vue'), meta: { requiresAuth: true } },
  { path: '/returned-apparatus', name: 'returned-apparatus', component: () => import('@/views/Labtech/ReturnedApparatus.vue'), meta: { requiresAuth: true } },

  { path: '/returned-equipments', name: 'returned-equipments', component: () => import('@/views/Labtech/ReturnedEquipments.vue'), meta: { requiresAuth: true } },

// STAFF
  { path: '/dean-dashboard', name: 'dean-dashboard', component: () => import('@/views/Dean/DeanDashboard.vue'), meta: { requiresAuth: true } },
  { path: '/staff-dashboard', name: 'staff-dashboard', component: () => import('@/views/Dean/StaffDashboard.vue'), meta: { requiresAuth: true } },
  { 
    path: '/supply-dashboard', 
    name: 'supply-dashboard', 
    component: () => import('@/views/Supply/Dashboard.vue'), 
    meta: { 
      requiresAuth: true
    } 
  },
  { path: '/secretary-dashboard', name: 'secretary-dashboard', component: () => import('@/views/Secretary/SecretaryDashboard.vue'), meta: { requiresAuth: true } },
// ICTC




  { path: '/items', name: 'IctcItemList', component: () => import('@/views/Ictc/ItemList.vue') },
  { path: '/items/:id/instances', name: 'IctcItemInstances', component: () => import('@/views/Ictc/ItemInstances.vue'), props: true },

  { path: '/instances', name: 'all-instances', component: () => import('@/views/Secretary/AllInstances.vue'), meta: { requiresAuth: true } },

//SUPPLY

  { 
    path: '/equipments', 
    name: 'equipment-list', 
    component: () => import('@/views/Labtech/EquipmentList.vue'), 
    meta: { 
      requiresAuth: true, 
      allowedUserTypes: ['Supply Office', 'Lab Technician', 'Dean'] 
    } 
  },
  { 
    path: '/equipment/:eqId/instances', 
    name: 'equipment-instances', 
    component: () => import('@/views/Labtech/EquipmentInstances.vue'), 
    props: true, 
    meta: { 
      requiresAuth: true, 
      allowedUserTypes: ['Supply Office', 'Lab Technician', 'Dean'] 
    } 
  },
  {
    path: '/equipment/:eqId/detail',
    name: 'equipment-detail',
    component: () => import('@/views/Labtech/EquipmentInstancesDetail.vue'),
    props: true

  },
  { 
    path: '/assigned-items', 
    name: 'assigned-items', 
    component: () => import('@/views/Secretary/AssignedList.vue'), 
    meta: { 
      requiresAuth: true, 
      allowedUserTypes: ['Supply Office', 'Staff', 'Dean'] 
    } 
  },
  { 
    path: '/assigned-equipments', 
    name: 'assigned-equipments', 
    component: () => import('@/views/Supply/AssignedEquipment.vue'), 
    meta: { 
      requiresAuth: true, 
      allowedUserTypes: ['Supply Office'] 
    } 
  },
  { 
    path: '/chemicals', 
    name: 'assigned-chemicals', 
    component: () => import('@/views/Supply/AssignedChemical.vue'), 
    meta: { 
      requiresAuth: true, 
      allowedUserTypes: ['Supply Office', 'Lab Technician', 'Dean'] 
    } 
  },
  { 
    path: '/transfer', 
    name: 'transfering', 
    component: () => import('@/views/Supply/TransferRequest.vue'), 
    meta: { 
      requiresAuth: true, 
      allowedUserTypes: ['Supply Office', 'Staff'] 
    } 
  },
  { 
    path: '/request', 
    name: 'transfer-request', 
    component: () => import('@/views/Supply/TurnoverRequest.vue'), 
    meta: { 
      requiresAuth: true, 
      allowedUserTypes: ['Supply Office', 'Staff'] 
    } 
  },
  { 
    path: '/category', 
    name: 'category-list', 
    component: () => import('@/views/Supply/CategoryList.vue'), 
    meta: { 
      requiresAuth: true, 
      allowedUserTypes: ['Secretary', 'Dean', 'Lab Technician'] 
    } 
  },
  { 
    path: '/category/:id/instances', 
    name: 'category-instances', 
    component: () => import('@/views/Supply/CategoryInstances.vue'), 
    props: true, 
    meta: { 
      requiresAuth: true, 
      allowedUserTypes: ['Secretary', 'Dean', 'Lab Technician'] 
    } 
  },


// SECRETARY

  {
    path: '/scan',
    name: 'scan',
    component: () => import('@/views/Secretary/ScanDetail.vue')
  },


  { path: '/damaged-items', name: 'damaged-items', component: () => import('@/views/Secretary/DamagedItems.vue'), meta: { requiresAuth: true } },

  { path: '/chemical', name: 'chemical-list', component: () => import('@/views/Secretary/ChemicalList.vue') },
  { path: '/chemical/:id/stocks', name: 'chemical-stocks', component: () => import('@/views/Labtech/ChemicalStock.vue'), props: route => ({ id: route.params.id, source: 'chemical' }) },
  { path: '/chemical-usage', name: 'chemical-usage', component: () => import('@/views/Labtech/ChemicalUsage.vue') },

  { path: '/batch', name: 'batch-list', component: () => import('@/views/Supply/BatchList.vue') },

  { path: '/batch/:id/items', name: 'item-batches', component: () => import('@/views/Supply/ItemBatch.vue'), props: true },
  { path: '/batch/:id/chemicals', name: 'chemical-batches', component: () => import('@/views/Supply/ChemicalBatch.vue'), props: true },


  {
    path: '/batch/:id/contents',  
    name: 'batch-contents',
    component: () => import('@/views/Supply/BatchItems.vue'),
    props: true,
  },
  {
    path: '/batch/contents/:id/instances',
    name: 'batch-instances',
    component: () => import('@/views/Secretary/ItemInstances.vue'),
    props: route => ({
      id: route.params.id,
      source: 'batch'
    })
  },
  {
    path: '/batch/contents/:id/stocks',
    name: 'batch-stocks', 
    component: () => import('@/views/Labtech/ChemicalStock.vue'),
    props: route => ({
      id: route.params.id,
      batchId: route.params.batchId,
      source: 'batch'
    })
  },

  {
    path: '/item-batches/:id/instances',
    name: 'item-instances',
    component: () => import('@/views/Secretary/ItemList.vue'),
    props: true
  },
  { 
    path: '/items-sec',
    name: 'items',
    component: () => import('@/views/Secretary/ItemList.vue'),
    meta: { requiresAuth: true }
  },
{
  path: '/items-sec/:id/instances',
  name: 'item-instances',
  component: () => import('@/views/Secretary/ItemInstances.vue'),
  props: route => ({
    id: route.params.id,
    source: 'item'
  })
},

  // ADMIN
  { path: '/staffs', name: 'staff-list', component: () => import('@/views/Admin/StaffList.vue') },
  { path: '/staff/borrowed/:barcode', name: 'staff-borrowed-list', component: () => import('@/views/Dean/StaffBorrowedList.vue'), props: true },
  { path: '/staff/assigned/:barcode', name: 'staff-assigned-list', component: () => import('@/views/Dean/StaffAssignedList.vue'), props: true },

  { path: '/dean-items', name: 'dean-assigned-list', component: () => import('@/views/Dean/DeanAssignedItems.vue'), meta: { requiresAuth: true, allowedUserTypes: ['Dean', 'Secretary'] } },
  { path: '/dean-equipments', name: 'dean-assigned-equipment', component: () => import('@/views/Dean/DeanAssignedEquipments.vue'), meta: { requiresAuth: true, allowedUserTypes: ['Dean', 'Lab Technician'] } },

  { path: '/barcode-scanner', name: 'BarcodeScanner', component: BarcodeScanner },
  { path: '/item-scanner', name: 'item-scanner', component: () => import('@/components/BarcodeDetail.vue') },
  { path: '/landing/:barcode', name: 'LandingPage', component: LandingPage },
  { path: '/borrow-items/:barcode', name: 'ItemBorrow', component: ItemBorrow},
  { path: '/borrowed-list/:barcode', name: 'StaffBorrowedList', component: StaffBorrowedList, props: true},
  

  // { path: '/equipment', name: 'EquipmentList', component: EquipmentList },
  // { path: '/equipment/:eqId/instances', name: 'equipment-instances', component: EquipmentInstances, props: true },
  { path: '/borrowed-equipment', name: 'BorrowedEquipment', component: BorrowedEquipment},
  { path: '/labtech-dashboard', name: 'LabtechDashboard', component: LabtechDashboard },


  { path: '/login', 
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/users',
    name: 'users',
    component: UserList,
    meta: { requiresAuth: true, allowedUserTypes: ['Admin'] }
  },

  {
    path: '/user/:id',
    name: 'user-detail',
    component: () => import('@/views/Admin/UserDetail.vue'),
    props: true
  },



  {
    path: '/rooms',
    name: 'rooms',
    component: RoomList,
    meta: { requiresAuth: true, allowedUserTypes: ['Admin', 'Dean'] }
  },
  {
    path: '/room/:id',
    name: 'room-detail',
    component: () => import('@/views/Admin/RoomDetail.vue'),
    props: true
  },
  {
    path: '/staff/:id',
    name: 'staff-detail',
    component: () => import('@/views/Admin/StaffDetail.vue'),
    props: true
  },

  // { 
  //   path: '/items-sec',
  //   name: 'items',
  //   component: ItemList,
  //   meta: { requiresAuth: true }
  // },
  // {
  //   path: '/items-sec/:id/instances',
  //   name: 'item-instances',
  //   component: () => import('@/views/Secretary/ItemInstances.vue'),
  //   props: route => ({
  //     id: route.params.id,
  //     source: 'item'
  //   })
  // },  
  {
    path: '/instances/:id/detail',
    name: 'ItemInstancesDetail',
    component: () => import('@/views/Secretary/ItemInstancesDetail.vue'),
    props: true

  },
  {
    path: '/borrow/:instanceId',
    name: 'BorrowItem',
    component: () => import('@/views/Secretary/BorrowItem.vue'),
    props: true
  },
  {
    path: '/borrowed-items',
    name: 'borrowed-items',
    component: () => import('@/views/Secretary/BorrowedList.vue'),
    meta: { requiresAuth: true }
  },
  
  {
    path: '/returned-items',
    name: 'returned-items',
    component: () => import('@/views/Secretary/ReturnedList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/distributed-items',
    name: 'distributed-items',
    component: () => import('@/views/Secretary/DistributedList.vue'),
    meta: { requiresAuth: true }
  },
  { 
    path: '/sidebar', 
    component: Sidebar,
    meta: { requiresAuth: true }
  },
  { path: '/', 
    redirect: '/profile' 
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/chemicals',
    name: 'chemicals',
    component: ChemicalList,
    meta: { requiresAuth: true, allowedUserTypes: ['Lab Technician'] }
  },
  {
    path: '/chemicals/:id',
    name: 'chemical-details',
    component: ChemicalDetails,
    props: true,
    meta: { requiresAuth: true, allowedUserTypes: ['Lab Technician'] }
  },
  {
    path: '/chemical/update/:id',
    name: 'chemical-update',
    component: ChemicalUpdateForm,
    props: true,
    meta: { requiresAuth: true, allowedUserTypes: ['Lab Technician'] }
  },

  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('../components/UnauthorizedView.vue'),
  },
  {
    // para dili maka adto sa wala ka exist na route
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]


const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated;
  const userType = store.getters.userType;

  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Route requires authentication
    if (!isAuthenticated) {
      next('/login');
    } else if (to.matched.some(record => record.meta.allowedUserTypes)) {
      // Check if user has the correct role
      if (to.meta.allowedUserTypes.includes(userType)) {
        next();
      } else {
        next('/unauthorized');
      }
    } else {
      next();
    }
  } else {
    // Non-authenticated routes
    if (to.path === '/login' && isAuthenticated) {
      // Redirect authenticated users away from the login page
      next('/profile');
    } else {
      next();
    }
  }
});


export default router;

