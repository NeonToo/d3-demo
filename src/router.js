import Vue from 'vue';
import VueRouter from 'vue-router';
import MindMap from './views/MindMap.vue';

Vue.use(VueRouter);

let routes = [
    {
        path: '/',
        name: 'app',
        component: MindMap
    }
];
const router = new VueRouter({
    mode: 'hash',
    base: __dirname,
    routes
});

export default router;