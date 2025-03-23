<script setup lang="ts">
    import { ref } from 'vue';
    import { useRouter } from 'vue-router';

    const url = ref('');
    const router = useRouter();
    const error = ref('');

    function normalizeUrl(inputUrl: string): string {
        try {
            const urlObject = new URL(inputUrl);
            return urlObject.hostname;
        } catch {
            try {
                const urlObject = new URL('https://' + inputUrl);
                return urlObject.hostname;
            } catch {
                throw new Error('Invalid URL format');
            }
        }
    }

    async function handleSubmit() {
        error.value = '';

        try {
            const normalizedUrl = normalizeUrl(url.value);
            
            // Check if we're in Chrome extension context
            if (typeof chrome === 'undefined' || !chrome.storage?.sync) {
                throw new Error('Chrome storage API not available');
            }
            
            // Get existing blocked sites from storage
            const result: { blockedSites: string[] } = await new Promise((resolve, reject) => {
                chrome.storage.sync.get(['blockedSites'], (result: { blockedSites: string[] }) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(result);
                    }
                });
            });

            const blockedSites = result.blockedSites || [];
            
            // Check for duplicates
            if (blockedSites.includes(normalizedUrl)) {
                error.value = 'This site is already blocked!';
                return;
            }
            
            // Add new URL to blocked sites
            blockedSites.push(normalizedUrl);
            
            // Save back to storage
            await chrome.storage.sync.set({ blockedSites });
            
            // Clear input and redirect to homepage
            url.value = '';
            router.push('/');
            
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to block site';
        }
    }
</script>

<template>
    <div class="block-container">
        <form @submit.prevent="handleSubmit">
            <label for="url">Enter site to block:</label>
            <input 
                type="text" 
                v-model="url" 
                placeholder="https://example.com"
                required
            >
            <div class="error" v-if="error">{{ error }}</div>
            <button type="submit">Block Site</button>
        </form>
    </div>
</template>

<style scoped>
.block-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
}

form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
}

label {
    font-weight: bold;
}

input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 5px;
}

button {
    padding: 0.5rem;
    background-color: #1669d5;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

button:hover {
    background-color: #1255b3;
}

.error {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: -0.5rem;
}
</style>