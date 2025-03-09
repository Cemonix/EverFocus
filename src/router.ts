import { createRouter, createWebHistory } from 'vue-router'
import BlockPage from './Pages/BlockPage.vue'
import Home from './Pages/HomePage.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/block',
        name: 'Block',
        component: BlockPage
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