<template>
    <div class="flex flex-col justify-center items-center h-screen bg-gray-100">
        <div class="text-center p-6 bg-white rounded-lg shadow-md">
            <div class="flex justify-center items-center mb-4">
                <i class="fas fa-exclamation-circle text-red-600 text-6xl"></i>
            </div>
            <h1 class="text-red-600 text-4xl font-bold mb-4">Unauthorized</h1>
            <p class="text-gray-700 text-lg mb-6">You do not have permission to access this page.</p>
            <router-link to="/" class="mt-6 inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <i class="fas fa-home mr-2"></i>
                Go to Home
            </router-link>
        </div>
    </div>
</template>

<script>
export default {
    name: 'UnauthorizedView'
}
</script>

<style scoped>
/* Tailwind CSS is used for styling, so minimal custom CSS is needed */
</style>
