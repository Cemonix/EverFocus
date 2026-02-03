<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { YouTubeSettings } from '../types/settings';
import { defaultSettings } from '../types/settings';

const settings = ref<YouTubeSettings>({ ...defaultSettings });

onMounted(async () => {
	const result = await chrome.storage.sync.get(['youtubeSettings']);
	if (result.youtubeSettings) {
		settings.value = result.youtubeSettings as YouTubeSettings;
	}

	// Refresh stats every 10 seconds
	setInterval(async () => {
		const result = await chrome.storage.sync.get(['youtubeSettings']);
		if (result.youtubeSettings) {
			settings.value = result.youtubeSettings as YouTubeSettings;
		}
	}, 10000);
});

// Get today's date string
function getTodayString(): string {
	return new Date().toISOString().split('T')[0]!;
}

// Get date string for N days ago
function getDateString(daysAgo: number): string {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	return date.toISOString().split('T')[0]!;
}

// Today's usage in milliseconds
const todayUsageMs = computed(() => {
	const today = getTodayString();
	return settings.value.dailyUsage[today] || 0;
});

// Format milliseconds to hours and minutes
function formatTime(ms: number): string {
	const totalMinutes = Math.floor(ms / (60 * 1000));
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	return `${minutes}m`;
}

// Time remaining today
const timeRemaining = computed(() => {
	if (!settings.value.dailyLimitEnabled) return null;

	const limitMs = settings.value.dailyLimitMinutes * 60 * 1000;
	const remaining = limitMs - todayUsageMs.value;

	if (remaining <= 0) return 'Limit reached';
	return formatTime(remaining);
});

// Last 7 days data for chart
const weeklyData = computed(() => {
	const data = [];
	for (let i = 6; i >= 0; i--) {
		const dateStr = getDateString(i);
		const usage = settings.value.dailyUsage[dateStr] || 0;
		const date = new Date(dateStr);
		const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

		data.push({
			day: dayName,
			date: dateStr,
			usage: usage,
			minutes: Math.floor(usage / (60 * 1000))
		});
	}
	return data;
});

// Max usage for scaling chart
const maxUsage = computed(() => {
	const max = Math.max(...weeklyData.value.map(d => d.minutes));
	return max > 0 ? max : 60; // minimum scale of 60 minutes
});

// Calculate bar height percentage
function getBarHeight(minutes: number): number {
	return (minutes / maxUsage.value) * 100;
}

// Streak calculation (consecutive days under limit)
const streak = computed(() => {
	if (!settings.value.dailyLimitEnabled) return 0;

	const limitMs = settings.value.dailyLimitMinutes * 60 * 1000;
	let count = 0;

	for (let i = 0; i < 30; i++) {
		const dateStr = getDateString(i);
		const usage = settings.value.dailyUsage[dateStr] || 0;

		if (usage <= limitMs) {
			count++;
		} else {
			break;
		}
	}

	return count;
});
</script>

<template>
	<div class="stats-container">
		<!-- Today's Stats -->
		<section class="stats-card">
			<h2>Today's Usage</h2>
			<div class="big-number">{{ formatTime(todayUsageMs) }}</div>
			<div class="stat-detail" v-if="timeRemaining">
				<span class="label">Time Remaining:</span>
				<span class="value">{{ timeRemaining }}</span>
			</div>
		</section>

		<!-- Streak Counter -->
		<section class="stats-card" v-if="settings.dailyLimitEnabled">
			<h2>Current Streak</h2>
			<div class="big-number">{{ streak }} {{ streak === 1 ? 'day' : 'days' }}</div>
			<p class="description">Days under your daily limit</p>
		</section>

		<!-- Weekly Chart -->
		<section class="stats-card chart-card">
			<h2>Last 7 Days</h2>
			<div class="chart">
				<div
					v-for="data in weeklyData"
					:key="data.date"
					class="bar-container"
				>
					<div class="bar-wrapper">
						<div
							class="bar"
							:style="{ height: getBarHeight(data.minutes) + '%' }"
							:title="`${data.day}: ${data.minutes} minutes`"
						>
							<span class="bar-label">{{ data.minutes }}m</span>
						</div>
					</div>
					<div class="bar-day">{{ data.day }}</div>
				</div>
			</div>
			<div class="chart-legend">
				<span>Max: {{ maxUsage }}m</span>
			</div>
		</section>

		<!-- Settings Info -->
		<section class="stats-card info-card">
			<h3>Active Settings</h3>
			<ul class="settings-list">
				<li v-if="settings.blockShorts">🚫 Shorts blocked</li>
				<li v-if="settings.hideFeed">📭 Feed hidden</li>
				<li v-if="settings.hideSidebar">👁️ Sidebar hidden</li>
				<li v-if="settings.hideComments">💬 Comments hidden</li>
				<li v-if="settings.dailyLimitEnabled">⏰ Daily limit: {{ settings.dailyLimitMinutes }}m</li>
				<li v-if="settings.searchOnlyMode">🔍 Search-only mode</li>
				<li v-if="settings.subscriptionsOnlyMode">📺 Subscriptions-only mode</li>
			</ul>
			<p v-if="!settings.blockShorts && !settings.hideFeed && !settings.dailyLimitEnabled" class="no-settings">
				No settings active. Visit Settings to configure.
			</p>
		</section>
	</div>
</template>

<style scoped>
.stats-container {
	padding: 1rem;
	max-height: 60vh;
	overflow-y: auto;
	scrollbar-width: thin;
	scrollbar-color: #696969 #b7b7b7;
}

.stats-card {
	background-color: white;
	padding: 1rem;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	margin-bottom: 1rem;
}

.stats-card h2 {
	font-size: 1.1rem;
	margin-bottom: 0.75rem;
	color: #333;
	border-bottom: 2px solid #4fbbbd;
	padding-bottom: 0.5rem;
}

.big-number {
	font-size: 2.5rem;
	font-weight: bold;
	color: #1669d5;
	text-align: center;
	margin: 1rem 0;
}

.stat-detail {
	display: flex;
	justify-content: space-between;
	padding: 0.5rem;
	background-color: #f9f9f9;
	border-radius: 4px;
	margin-top: 0.5rem;
}

.stat-detail .label {
	color: #666;
	font-weight: 500;
}

.stat-detail .value {
	color: #333;
	font-weight: 600;
}

.description {
	text-align: center;
	color: #666;
	font-size: 0.9rem;
	margin-top: 0.5rem;
}

.chart-card {
	padding: 1rem 0.5rem;
}

.chart {
	display: flex;
	justify-content: space-around;
	align-items: flex-end;
	height: 150px;
	padding: 1rem 0.5rem 0;
	gap: 0.5rem;
}

.bar-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	height: 100%;
}

.bar-wrapper {
	flex: 1;
	width: 100%;
	display: flex;
	align-items: flex-end;
	justify-content: center;
}

.bar {
	width: 100%;
	max-width: 40px;
	background: linear-gradient(to top, #1669d5, #4fbbbd);
	border-radius: 4px 4px 0 0;
	position: relative;
	min-height: 2px;
	transition: all 0.3s ease;
	cursor: pointer;
}

.bar:hover {
	opacity: 0.8;
}

.bar-label {
	position: absolute;
	top: -20px;
	left: 50%;
	transform: translateX(-50%);
	font-size: 0.7rem;
	color: #666;
	white-space: nowrap;
}

.bar-day {
	margin-top: 0.5rem;
	font-size: 0.8rem;
	color: #666;
	font-weight: 500;
}

.chart-legend {
	text-align: right;
	font-size: 0.75rem;
	color: #999;
	margin-top: 0.5rem;
	padding-right: 0.5rem;
}

.info-card h3 {
	font-size: 1rem;
	margin-bottom: 0.75rem;
	color: #333;
}

.settings-list {
	list-style: none;
	padding: 0;
	margin: 0;
}

.settings-list li {
	padding: 0.5rem;
	background-color: #f9f9f9;
	border-radius: 4px;
	margin-bottom: 0.5rem;
	font-size: 0.9rem;
}

.no-settings {
	text-align: center;
	color: #999;
	font-style: italic;
	padding: 1rem;
}
</style>
