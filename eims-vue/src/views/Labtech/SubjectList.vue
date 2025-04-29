<template>
    <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
      <Sidebar @sidebarToggle="handleSidebarToggle" />
      <div 
        :class="[
          'flex-1 overflow-x-auto p-8 transition-all duration-300',
          isSidebarOpen ? 'lg:ml-64' : 'ml-0'
        ]"
      >
        <div class="max-w-full bg-white/80 backdrop-blur-md shadow-lg rounded-lg p-8">
          <button @click="goBack" class="flex items-center mb-6 text-gray-700 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
  
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Subject List</h1>
  
          <div class="flex justify-between mb-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search ..."
              class="border border-gray-300 rounded py-2 px-4"
            />
  
            <PrimaryButton @click="openAddChemicalForm">
              <template #icon>
                <i class="fas fa-plus mr-2"></i>
              </template>
              Add Subject
            </PrimaryButton>
          </div>
  

  
  
          <div v-if="loading" class="py-4 flex justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span class="ml-2">Loading...</span>
          </div>
  
          <div v-else-if="error" class="text-red-500 py-4">
            {{ error }}
          </div>
  
  
          <div class="overflow-x-auto">
            <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert">
              <p class="font-bold">Success</p>
              <p>{{ successMessage }}</p>
            </div>
            <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
              <p class="font-bold">Error</p>
              <p>{{ error }}</p>
            </div>

            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th v-for="header in tableHeaders" 
                      :key="header" 
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="subject in filteredSubjects" 
                  :key="subject.id" 
                  :class="[
                    'transition-colors duration-150 cursor-pointer',
                  ]"
                >
                  <td class="px-4 py-4">
                    <span class="text-gray-500">
                      {{ subject.code }}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <span class="text-gray-500">
                      {{ subject.name }}
                    </span>
                  </td>
                  <td class="px-4 py-4" @click.stop>
                    <div class="flex space-x-1">
                      <button 
                        @click="editSubject(subject)"
                        class="text-blue-500 hover:text-blue-800 border border-blue-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                      >
                        <i class="pi pi-pencil" style="font-size: 14px"></i>
                      </button>
                      <button 
                        @click="handleDeleteClick(subject.id)"
                        class="text-red-500 hover:text-red-800 border border-red-300 rounded-full p-1 flex items-center justify-center w-7 h-7 ml-2"
                      >
                        <i class="pi pi-trash" style="font-size: 14px"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
  
      <!-- Chemical Form Modal -->
      <div v-if="showAddForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
        <AddSubject
          :subjects="subjects"
          @close="showAddForm = false"
          @subject-added="handleSubjectAdded"
        />
      </div>
      <div v-if="showUpdateForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
        <UpdateSubject
          :subject="selectedSubject"
          @close="closeUpdateForm"
          @subject-updated="handleSubjectUpdated"
        />
      </div>
      <ConfirmButton
          v-model:visible="showDialog"
          title="Delete Subject"
          message="Are you sure you want to delete this subject?"
          @confirm="confirmDelete"
          @cancel="handleCancel"
        />
  
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, onMounted, computed, watch } from 'vue';
  import axios from 'axios';
  import { useRouter } from 'vue-router';
  import Sidebar from '@/components/UserType/Sidebar.vue';
  import PrimaryButton from '@/components/buttons/PrimaryButton.vue';
  import ConfirmButton from '@/components/buttons/ConfirmButton.vue';
import UpdateSubject from './Forms/UpdateSubject.vue';
import AddSubject from './Forms/AddSubject.vue';

  
  export default defineComponent({
    name: 'SubjectList',
    components: {
      Sidebar,
      PrimaryButton,
        UpdateSubject,
        AddSubject,
      ConfirmButton
    },
    setup() {
      const router = useRouter();
      const loading = ref(true);
      const error = ref(null);
      const successMessage = ref(null);
      const subjects = ref([]);
      const searchQuery = ref('');
      const showAddForm = ref(false);
      const showUpdateForm = ref(false);
      const isSidebarOpen = ref(false);
      const selectedSubject = ref(null);
      const tableHeaders = ['Subject Code', 'Subject Name', 'Actions'];
      const showDialog = ref(false);
      const subjectToDelete = ref(null);

      const currentPage = ref(1);
      const totalPages = ref(0);
      const itemsPerPage = ref(10);
  
      const goBack = () => {
        router.back();
      };
  

      const fetchSubjects = async () => {
        loading.value = true;
        error.value = null;
        try {
          const response = await axios.get('/api/subject-list/', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            params: {
              search: searchQuery.value
            }
          });
          subjects.value = response.data;
        } catch (err) {
          console.error('Error fetching subjects:', err);
          error.value = err.message || 'An error occurred while fetching subjects.';
        } finally {
          loading.value = false;
        }
      }

      watch(searchQuery, () => {
      currentPage.value = 1;  
      fetchSubjects();
    });
  
      const handleDeleteClick = (subjectId) => {
        subjectToDelete.value = subjectId;
        showDialog.value = true
      }
  
      const confirmDelete = async () => {
        if (subjectToDelete.value) {
          try {
            await axios.delete(`/api/subject/${subjectToDelete.value}/delete/`);
  
            successMessage.value = "Subject deleted successfully.";
            setTimeout(() => {
              successMessage.value = null;
            }, 1000);
            
            fetchSubjects();
          } catch (err) {
            console.error("Error deleting subject:", err);
            error.value = "Failed to delete subject. Please try again.";
          } finally {
            showDialog.value = false
            subjectToDelete.value = null
          }
        }
      }

      const editSubject = (subject) => {
        selectedSubject.value = subject;
        showUpdateForm.value = true;
      };
  
      const closeUpdateForm = () => {
        selectedSubject.value = null;
        showUpdateForm.value = false;
      };
  
      const navigateToChemicalStocks = (chemicalId) => {
        router.push({ name: 'chemical-stocks', params: { id: chemicalId } });
      };
  
      const openAddChemicalForm = () => {
        showAddForm.value = true;
      };
  
      const handleCancel = () => {
        showDialog.value = false;
        subjectToDelete.value = null;
      };
  
      const handleSubjectUpdated = async () => {
        await fetchSubjects();
        closeUpdateForm();
      };
  
      const handleSubjectAdded = async () => {
        await fetchSubjects();
        showAddForm.value = false;
      };
  
      const filteredSubjects = computed(() => {
        if (!searchQuery.value) return subjects.value;
        
        const query = searchQuery.value.toLowerCase();
        return subjects.value.filter(subject => 
            subject.name.toLowerCase().includes(query) || 
            subject.code.toLowerCase().includes(query)
        );
      });
  
      const handleSidebarToggle = (isOpen) => {
        isSidebarOpen.value = isOpen;
      };
  
      onMounted(() => {
        fetchSubjects();
        isSidebarOpen.value = window.innerWidth >= 1024;
      });
  
      return {
        goBack,
        subjects,
        loading,
        error,
        editSubject,
        handleDeleteClick,
        showDialog,
        handleCancel,
        confirmDelete,
        closeUpdateForm,
        tableHeaders,
        filteredSubjects,
        searchQuery,
        showAddForm,
        showUpdateForm,
        openAddChemicalForm,
        handleSubjectAdded,
        handleSubjectUpdated,
        navigateToChemicalStocks,
        isSidebarOpen,
        successMessage,
        handleSidebarToggle,
        selectedSubject,
        currentPage,
        totalPages,
        itemsPerPage
      };
    }
  });
  </script>