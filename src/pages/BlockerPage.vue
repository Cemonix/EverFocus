<script setup lang="ts">
import { ref, onMounted, watch, toRaw } from 'vue';
import type { BlockerSettings } from '../types/settings';
import { defaultBlockerSettings } from '../types/settings';

const blockerSettings = ref<BlockerSettings>({ ...defaultBlockerSettings });
const newSiteInput = ref('');
const saveMessage = ref('');
const isLoaded = ref(false);

onMounted(async () => {
    try {
        const result = await chrome.storage.sync.get(['blockerSettings']);
        if (result.blockerSettings) {
            const stored = result.blockerSettings as BlockerSettings;
            blockerSettings.value = {
                ...defaultBlockerSettings,
                ...stored,
                blockedSites: Array.isArray(stored.blockedSites) ? [...stored.blockedSites] : []
            };
        }
    } catch (e) {
        console.error('Failed to load settings', e);
    }
    isLoaded.value = true;
});

watch(
	() => blockerSettings.value,
	async (value) => {
		if (!isLoaded.value) {
			return;
		}
		// Guard against blockedSites being undefined/null
		if (!value.blockedSites || !Array.isArray(value.blockedSites)) {
			console.warn('BlockerSettings blockedSites invalid, resetting to array');
			value.blockedSites = [];
		}
		try {
			const payload = structuredClone
				? structuredClone(toRaw(value))
				: JSON.parse(JSON.stringify(toRaw(value)));
			await chrome.storage.sync.set({ blockerSettings: payload });
		} catch (err) {
			console.error('Failed to auto-save blocker settings:', err);
		}
	},
	{ deep: true }
);

async function saveSettings() {
	try {
		const payload = structuredClone
			? structuredClone(toRaw(blockerSettings.value))
			: JSON.parse(JSON.stringify(toRaw(blockerSettings.value)));
		await chrome.storage.sync.set({ blockerSettings: payload });
		saveMessage.value = 'Settings saved!';
		setTimeout(() => {
			saveMessage.value = '';
		}, 2000);
	} catch (err) {
		saveMessage.value = 'Failed to save settings';
		console.error('Failed to save settings:', err);
	}
}

function normalizeSiteInput(input: string): string {
	let cleaned = input.trim().toLowerCase();
	cleaned = cleaned.replace(/^https?:\/\//, '');
	cleaned = cleaned.replace(/^www\./, '');
	cleaned = cleaned.split('/')[0] || cleaned;
	cleaned = cleaned.split(':')[0] || cleaned;
	return cleaned;
}

function addBlockedSite() {
	const site = normalizeSiteInput(newSiteInput.value);
	if (site && !blockerSettings.value.blockedSites.includes(site)) {
		blockerSettings.value.blockedSites.push(site);
		newSiteInput.value = '';
		saveSettings();
	}
}

function removeBlockedSite(index: number) {
	if (index < 0 || index >= blockerSettings.value.blockedSites.length) {
		return;
	}
	blockerSettings.value.blockedSites = blockerSettings.value.blockedSites.filter(
		(_, i) => i !== index
	);
	saveSettings();
}
</script>

<template>
	<div class="blocker-container">
		<div class="save-message" v-if="saveMessage">{{ saveMessage }}</div>

		<section class="settings-section">
			<h2>Site Blocker</h2>
			<div class="setting-item">
				<label>
					<input type="checkbox" v-model="blockerSettings.enabled">
					Enable Site Blocker
				</label>
				<p class="description">Block distracting sites with a cooldown timer</p>
			</div>

			<div v-if="blockerSettings.enabled">
				<div class="setting-item">
					<label class="sub-label">Blocked Sites</label>
					<div class="site-input-group">
						<input
							type="text"
							v-model="newSiteInput"
							placeholder="e.g. reddit.com"
							@keyup.enter="addBlockedSite"
							class="site-input"
						>
						<button type="button" class="add-btn" @click="addBlockedSite">Add</button>
					</div>
					<ul class="blocked-sites-list">
						<li v-for="(site, index) in blockerSettings.blockedSites" :key="`${site}-${index}`">
							<span>{{ site }}</span>
							<button type="button" class="remove-btn" @click="removeBlockedSite(index)">Remove</button>
						</li>
					</ul>
					<p v-if="blockerSettings.blockedSites.length === 0" class="description">
						No sites blocked yet.
					</p>
				</div>

				<div class="setting-item">
					<label class="sub-label">Cooldown Duration</label>
					<div class="input-group">
						<input
							type="number"
							v-model.number="blockerSettings.cooldownSeconds"
							min="5"
							max="300"
						>
						<span>seconds</span>
					</div>
					<p class="description">Wait time before you can proceed to a blocked site</p>
				</div>

				<div class="setting-item">
					<label class="sub-label">Grace Period</label>
					<div class="input-group">
						<input
							type="number"
							v-model.number="blockerSettings.gracePeriodMinutes"
							min="1"
							max="60"
						>
						<span>minutes</span>
					</div>
					<p class="description">After cooldown, the site stays accessible for this duration</p>
				</div>
			</div>
		</section>

		<button class="save-button" @click="saveSettings">Save Settings</button>
	</div>
</template>

<style scoped>
.blocker-container {
	padding: 1rem;
	max-height: 60vh;
	overflow-y: auto;
	scrollbar-width: thin;
	scrollbar-color: #696969 #b7b7b7;
}

.save-message {
	position: fixed;
	top: 1rem;
	right: 1rem;
	background-color: #4fbbbd;
	color: white;
	padding: 0.5rem 1rem;
	border-radius: 5px;
	z-index: 1000;
	animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
	from {
		transform: translateX(100%);
	}
	to {
		transform: translateX(0);
	}
}

.settings-section {
	margin-bottom: 1.5rem;
	padding: 1rem;
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-section h2 {
	font-size: 1.2rem;
	margin-bottom: 1rem;
	color: #333;
	border-bottom: 2px solid #4fbbbd;
	padding-bottom: 0.5rem;
}

.setting-item {
	margin-bottom: 1rem;
	padding: 0.5rem;
}

.setting-item label {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 500;
	cursor: pointer;
}

.setting-item input[type="checkbox"] {
	width: 18px;
	height: 18px;
	cursor: pointer;
}

.description {
	margin: 0.25rem 0 0 1.75rem;
	font-size: 0.85rem;
	color: #666;
}

.input-group {
	margin: 0.5rem 0 0 1.75rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.input-group input[type="number"] {
	width: 80px;
	padding: 0.4rem;
	border: 1px solid #ccc;
	border-radius: 4px;
	font-size: 0.9rem;
}

.sub-label {
	font-weight: 500;
	display: block;
	cursor: default;
}

.site-input-group {
	display: flex;
	gap: 0.5rem;
	margin: 0.5rem 0;
}

.site-input {
	flex: 1;
	padding: 0.4rem 0.6rem;
	border: 1px solid #ccc;
	border-radius: 4px;
	font-size: 0.9rem;
}

.blocked-sites-list {
	list-style: none;
	padding: 0;
	margin: 0.5rem 0 0 0;
}

.blocked-sites-list li {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.4rem 0.6rem;
	background-color: #f9f9f9;
	border-radius: 4px;
	margin-bottom: 0.25rem;
	font-size: 0.9rem;
}

.add-btn {
	padding: 0.5rem 1rem;
	background-color: #4fbbbd;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.9rem;
}

.add-btn:hover {
	background-color: #3da9ab;
}

.remove-btn {
	padding: 0.2rem 0.5rem;
	background-color: #f44336;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.8rem;
}

.remove-btn:hover {
	background-color: #d32f2f;
}

.save-button {
	width: 100%;
	padding: 0.75rem;
	background-color: #1669d5;
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 1rem;
	font-weight: 600;
	margin-top: 1rem;
	transition: background-color 0.2s;
}

.save-button:hover {
	background-color: #1457b3;
}
</style>
