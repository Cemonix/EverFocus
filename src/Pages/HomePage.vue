<script setup lang="ts">
	import { ref, onMounted } from 'vue';
	import TableRow from '../components/TableRow.vue';
	import type { BlockedSite } from '../types/blockedSites';

	const blockedSites = ref<BlockedSite[]>([]);

	onMounted(async () => {
		const result = await chrome.storage.sync.get(['blockedSites']);
		// Convert existing array format to new format if needed
		blockedSites.value = result.blockedSites?.map((site: string | BlockedSite) => {
			if (typeof site === 'string') {
				return { url: site, disabled: false };
			}
			return site;
		}) || [];
	});

	const handleDisable = async (url: string) => {
		try {
			const updatedSites = blockedSites.value.map(site => 
				site.url === url ? { ...site, disabled: !site.disabled } : site
			);
			
			await chrome.storage.sync.set({ blockedSites: updatedSites });
			blockedSites.value = updatedSites;
		} catch (err) {
			console.error('Failed to update site status:', err);
		}
	};

	const handleDelete = async (url: string) => {
		try {
			// Filter out the deleted site using local state
			const updatedSites = blockedSites.value.filter(site => site.url !== url);
			
			// Save to storage
			await chrome.storage.sync.set({ blockedSites: updatedSites });
			
			// Update local state
			blockedSites.value = updatedSites;
		} catch (err) {
			console.error('Failed to delete site:', err);
		}
	};
</script>

<template>
	<div class="table-container">
		<table v-if="blockedSites.length > 0">
			<thead>
                <tr>
                    <th>Blocked Page</th>
                    <th>Actions</th>
                </tr>
            </thead>
			<tbody>
				<TableRow 
                    v-for="site in blockedSites"
                    :key="site.url"
					:blocked-site="site"
					@disable="handleDisable"
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
