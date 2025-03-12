<script setup lang="ts">
	import { ref, onMounted } from 'vue';
	import TableRow from '../components/TableRow.vue';

	const blockedPages = ref<string[]>([]);

	onMounted(() => {
		chrome.storage.sync.get(['blockedSites'], (result) => {
			blockedPages.value = result.blockedSites || [];
		});
	});

	const handleDelete = async (site: string) => {
		try {
			// Get current blocked sites
			const result = await chrome.storage.sync.get(['blockedSites']);
			const sites = result.blockedSites || [];
			
			// Filter out the deleted site
			const updatedSites = sites.filter((s: string) => s !== site);
			
			// Save back to storage
			await chrome.storage.sync.set({ blockedSites: updatedSites });
			
			// Update local state
			blockedPages.value = updatedSites;
		} catch (err) {
			console.error('Failed to delete site:', err);
		}
	};
</script>

<template>
	<div class="table-container">
		<table v-if="blockedPages.length > 0">
			<thead>
                <tr>
                    <th>Blocked Page</th>
                    <th>Actions</th>
                </tr>
            </thead>
			<tbody>
				<TableRow 
                    v-for="page in blockedPages" 
                    :key="page" 
                    :blocked-page="page"
                    @delete="handleDelete"
                />
			</tbody>
		</table>
		<div v-else class="no-sites">
            No blocked sites to display.
        </div>
	</div>
</template>

<style scoped>
	.table-container {
		max-height: 55vh;
		display: flex;
		justify-content: center;
		overflow-y: auto;
		padding: 0.5rem;
		scrollbar-width: thin;
    	scrollbar-color: #696969 #b7b7b7 ;
	}

	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0 0.5em;
	}

	.no-sites {
		text-align: center;
		color: #666;
		padding: 1rem;
	}
</style>
