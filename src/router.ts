import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('./pages/HomePage.vue')
    },
    {
        path: '/block',
        name: 'Block',
        component: () => import('./pages/BlockNewSitePage.vue')
    },
    {
        path: '/edit/:site',
        name: 'Edit',
        component: () => import('./pages/EditPage.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: { name: 'Home' }
    }
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})