import Vue from 'vue';
import VueRouter from 'vue-router';
import MindMap from './views/MindMap.vue';
import Map from './views/Map.vue';

Vue.use(VueRouter);

let routes = [
    {
        path: '/',
        name: 'app',
        component: MindMap
    },
    {
        path: '/map',
        name: 'map',
        component: Map
    }
];
const router = new VueRouter({
    mode: 'hash',
    base: __dirname,
    routes
});

export default router;