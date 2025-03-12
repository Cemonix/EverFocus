<script setup lang="ts">
    import { useRouter } from 'vue-router';
    import type { BlockedSite } from '../types/blockedSites';

    const router = useRouter();

    const props = defineProps<{
        blockedSite: BlockedSite
    }>()

    const emit = defineEmits<{
        disable: [site: string],
        delete: [site: string]
    }>();

    const handleEdit = () => {
        router.push(`/edit/${props.blockedSite}`);
    };

    const handleDisable = () => {
        emit('disable', props.blockedSite.url);
    };

    const handleDelete = () => {
        emit('delete', props.blockedSite.url);
    };
</script>

<template>
    <tr class="row" :class="{ 'disabled': blockedSite.disabled }">
        <td class="td-page">{{ blockedSite.url }}</td>
        <td>
            <div class="btn-group">
                <input 
                    type="checkbox" 
                    class="disable-checkbox" 
                    :checked="!blockedSite.disabled"
                    @change="handleDisable" 
                />
                <button class="edit-btn" @click="handleEdit">Edit</button>
                <button class="delete-btn" @click="handleDelete">Delete</button>
            </div>
        </td>
    </tr>
</template>

<style scoped>
    .row {
        background-color: #f0f0f0;
        outline: thin solid black;
    }

    .td-page {
        padding: 0.5rem;
    }

    .btn-group {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }

    .edit-btn {
        background-color: #4fbbbd;
        color: white;
        font-size: 0.8rem;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        padding: 0.2rem;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    .disabled {
        opacity: 0.5;
    }

    .disable-checkbox {
        cursor: pointer;
        width: 1rem;
        height: 1rem;
    }

    .delete-btn {
        background-color: #f44336;
        color: white;
        font-size: 0.8rem;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        padding: 0.2rem;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
</style>