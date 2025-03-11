<script setup lang="ts">
    defineProps<{
        blockedPage: string
    }>()
</script>

<template>
    <tr class="row">
        <td class="td-page"> {{ blockedPage }} </td>
        <td>
            <div class="btn-group">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
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