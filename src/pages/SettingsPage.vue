<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { YouTubeSettings, ScheduleBlock } from '../types/settings';
import { defaultSettings } from '../types/settings';

const settings = ref<YouTubeSettings>({ ...defaultSettings });
const saveMessage = ref('');

onMounted(async () => {
	const result = await chrome.storage.sync.get(['youtubeSettings']);
	if (result.youtubeSettings) {
		settings.value = result.youtubeSettings as YouTubeSettings;
	}
});

async function saveSettings() {
	try {
		await chrome.storage.sync.set({ youtubeSettings: settings.value });
		saveMessage.value = 'Settings saved!';
		setTimeout(() => {
			saveMessage.value = '';
		}, 2000);
	} catch (err) {
		saveMessage.value = 'Failed to save settings';
		console.error('Failed to save settings:', err);
	}
}

function addScheduleBlock() {
	settings.value.scheduleBlocks.push({
		days: [1, 2, 3, 4, 5], // Mon-Fri default
		startTime: '09:00',
		endTime: '17:00'
	});
}

function removeScheduleBlock(index: number) {
	settings.value.scheduleBlocks.splice(index, 1);
}

function toggleDay(block: ScheduleBlock, day: number) {
	const index = block.days.indexOf(day);
	if (index > -1) {
		block.days.splice(index, 1);
	} else {
		block.days.push(day);
		block.days.sort();
	}
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
</script>

<template>
	<div class="settings-container">
		<div class="save-message" v-if="saveMessage">{{ saveMessage }}</div>

		<!-- Content Controls Section -->
		<section class="settings-section">
			<h2>Content Controls</h2>
			<div class="setting-item">
				<label>
					<input type="checkbox" v-model="settings.blockShorts">
					Block Shorts
				</label>
				<p class="description">Hide YouTube Shorts completely</p>
			</div>
			<div class="setting-item">
				<label>
					<input type="checkbox" v-model="settings.hideFeed">
					Hide Home Feed
				</label>
				<p class="description">Remove recommended videos on homepage</p>
			</div>
			<div class="setting-item">
				<label>
					<input type="checkbox" v-model="settings.hideSidebar">
					Hide Sidebar
				</label>
				<p class="description">Remove video recommendations sidebar</p>
			</div>
			<div class="setting-item">
				<label>
					<input type="checkbox" v-model="settings.hideComments">
					Hide Comments
				</label>
				<p class="description">Remove comments section</p>
			</div>
			<div class="setting-item">
				<label>
					<input type="checkbox" v-model="settings.hideEndScreens">
					Hide End Screens
				</label>
				<p class="description">Remove video suggestions at end</p>
			</div>
			<div class="setting-item">
				<label>
					<input type="checkbox" v-model="settings.blockInfiniteScroll">
					Block Infinite Scroll
				</label>
				<p class="description">Prevent endless feed scrolling - see only initial content</p>
			</div>
		</section>

		<!-- Time Management Section -->
		<section class="settings-section">
			<h2>Time Management</h2>
			<div class="setting-item">
				<label>
					<input type="checkbox" v-model="settings.dailyLimitEnabled">
					Daily Time Limit
				</label>
				<div v-if="settings.dailyLimitEnabled" class="input-group">
					<input
						type="number"
						v-model.number="settings.dailyLimitMinutes"
						min="1"
						max="480"
					>
					<span>minutes per day</span>
				</div>
			</div>
			<div class="setting-item">
				<label>
					<input type="checkbox" v-model="settings.sessionWarningEnabled">
					Session Warning
				</label>
				<div v-if="settings.sessionWarningEnabled" class="input-group">
					<input
						type="number"
						v-model.number="settings.sessionWarningMinutes"
						min="1"
						max="240"
					>
					<span>minutes continuous watching</span>
				</div>
			</div>
			<div class="setting-item">
				<label>
					<input type="checkbox" v-model="settings.scheduleEnabled">
					Schedule Blocking
				</label>
				<p class="description">Block YouTube during specific times</p>
				<div v-if="settings.scheduleEnabled" class="schedule-blocks">
					<div
						v-for="(block, index) in settings.scheduleBlocks"
						:key="index"
						class="schedule-block"
					>
						<div class="day-selector">
							<button
								v-for="(day, dayIndex) in dayNames"
								:key="dayIndex"
								type="button"
								:class="{ active: block.days.includes(dayIndex) }"
								@click="toggleDay(block, dayIndex)"
							>
								{{ day }}
							</button>
						</div>
						<div class="time-inputs">
							<input type="time" v-model="block.startTime">
							<span>to</span>
							<input type="time" v-model="block.endTime">
							<button type="button" class="remove-btn" @click="removeScheduleBlock(index)">
								Remove
							</button>
						</div>
					</div>
					<button type="button" class="add-btn" @click="addScheduleBlock">
						Add Schedule Block
					</button>
				</div>
			</div>
		</section>

		<!-- Usage Modes Section -->
		<section class="settings-section">
			<h2>Usage Modes</h2>
			<div class="setting-item">
				<label>
					<input type="checkbox" v-model="settings.searchOnlyMode">
					Search-Only Mode
				</label>
				<p class="description">Redirect homepage to search (intentional usage only)</p>
			</div>
			<div class="setting-item">
				<label>
					<input type="checkbox" v-model="settings.subscriptionsOnlyMode">
					Subscriptions-Only Mode
				</label>
				<p class="description">Always redirect to your subscriptions feed</p>
			</div>
		</section>

		<button class="save-button" @click="saveSettings">Save Settings</button>
	</div>
</template>

<style scoped>
.settings-container {
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

.schedule-blocks {
	margin-top: 0.5rem;
}

.schedule-block {
	padding: 1rem;
	margin-bottom: 1rem;
	background-color: #f9f9f9;
	border-radius: 6px;
	border: 1px solid #e0e0e0;
}

.day-selector {
	display: flex;
	gap: 0.25rem;
	margin-bottom: 0.75rem;
}

.day-selector button {
	flex: 1;
	padding: 0.4rem 0.2rem;
	border: 1px solid #ccc;
	background-color: white;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.8rem;
	transition: all 0.2s;
}

.day-selector button.active {
	background-color: #4fbbbd;
	color: white;
	border-color: #4fbbbd;
}

.day-selector button:hover {
	border-color: #4fbbbd;
}

.time-inputs {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.time-inputs input[type="time"] {
	padding: 0.4rem;
	border: 1px solid #ccc;
	border-radius: 4px;
	font-size: 0.9rem;
}

.remove-btn {
	padding: 0.4rem 0.75rem;
	background-color: #f44336;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.85rem;
	margin-left: auto;
}

.remove-btn:hover {
	background-color: #d32f2f;
}

.add-btn {
	padding: 0.5rem 1rem;
	background-color: #4fbbbd;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.9rem;
	margin-top: 0.5rem;
}

.add-btn:hover {
	background-color: #3da9ab;
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
