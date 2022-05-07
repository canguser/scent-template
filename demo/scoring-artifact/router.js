import { Scent } from './lib.js';
import { home } from './pages/home.js';

const { defineRouter } = Scent;

export const router = defineRouter({
    rules: [
        {
            path: '/',
            default: true,
            component: home,
        }
    ]
})