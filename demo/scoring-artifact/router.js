import { Scent } from './lib.js';
import { home } from './pages/home.js';
import { single } from './pages/single.js';

const { createRouter } = Scent;

const _router = createRouter({
    rules: [
        {
            path: '/',
            default: true,
            component: home
        },
        {
            path: '/single',
            component: single
        }
    ]
});

export const router = () => _router;
