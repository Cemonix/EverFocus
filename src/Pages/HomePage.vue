<script setup lang="ts">
import { ref } from 'vue';
import TableRow from '../components/TableRow.vue';

const blockedPages = ref<string[]>(['hello', 'world', 'foo', 'bar']);
</script>

<template>
	<div class="table-container">
		<table>
			<tbody>
				<TableRow v-for="page in blockedPages" :blockedPage="page" />
			</tbody>
		</table>
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
</style>
