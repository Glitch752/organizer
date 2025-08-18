import { mount } from 'svelte';
import './app.scss';
import App from './App.svelte';
import "./stores/sync";

const app = mount(App, {
    target: document.getElementById('app')!,
    props: undefined
});

export default app;