import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Settings',
        component: () => import('./pages/SettingsPage.vue')
    },
    {
        path: '/blocker',
        name: 'Blocker',
        component: () => import('./pages/BlockerPage.vue')
    },
    {
        path: '/stats',
        name: 'Stats',
        component: () => import('./pages/StatsPage.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: { name: 'Settings' }
    }
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})