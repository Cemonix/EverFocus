<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const url = ref('');
const error = ref('');

onMounted(() => {
    // Get the URL from route params
    const siteToEdit = route.params.site as string;
    if (siteToEdit) {
        url.value = siteToEdit;
    }
});

async function handleSubmit() {
    try {
        const oldUrl = route.params.site as string;
        // Get current blocked sites
        const result = await chrome.storage.sync.get(['blockedSites']);
        const sites = result.blockedSites || [];
        
        // Find and replace the old URL
        const updatedSites = sites.map((site: string) => 
            site === oldUrl ? url.value : site
        );
        
        // Save back to storage
        await chrome.storage.sync.set({ blockedSites: updatedSites });
        
        // Redirect back to homepage
        router.push('/');
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to update site';
    }
}
</script>

<template>
    <div class="edit-container">
        <h2>Edit Blocked Site</h2>
        <form @submit.prevent="handleSubmit">
            <input 
                type="text" 
                v-model="url" 
                placeholder="Enter URL..."
                required
            >
            <div class="error" v-if="error">{{ error }}</div>
            <div class="button-group">
                <button type="submit" class="save-btn">Save</button>
                <button type="button" class="cancel-btn" @click="router.push('/')">Cancel</button>
            </div>
        </form>
    </div>
</template>

<style scoped>
.edit-container {
    padding: 1rem;
    max-width: 400px;
    margin: 0 auto;
}

form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.button-group {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.save-btn {
    padding: 0.5rem 1rem;
    background-color: #4fbbbd;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.cancel-btn {
    padding: 0.5rem 1rem;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.error {
    color: #dc3545;
    font-size: 0.875rem;
}
</style>