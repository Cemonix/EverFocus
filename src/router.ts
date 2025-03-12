import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('./Pages/HomePage.vue')
    },
    {
        path: '/block',
        name: 'Block',
        component: () => import('./Pages/BlockNewSitePage.vue')
    },
    {
        path: '/edit/:site',
        name: 'Edit',
        component: () => import('./Pages/EditPage.vue')
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