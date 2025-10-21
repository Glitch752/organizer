import { mount } from 'svelte';
import './app.scss';
import App from './App.svelte';
import "./connection";
import { route } from './stores/router';

import Auth from './pages/Auth.svelte';
import Calendar from './pages/Calendar.svelte';
import CalendarHeader from './pages/CalendarHeader.svelte';
import CalendarNav from './pages/CalendarNav.svelte';
import Home from './pages/Home.svelte';
import Page from './pages/Page.svelte';
import PageHeader from './pages/PageHeader.svelte';
import PageNav from './pages/PageNav.svelte';

// Scuffed way to avoid circular imports
route.componentRegistry.Auth = Auth;
route.componentRegistry.Calendar = Calendar;
route.componentRegistry.CalendarHeader = CalendarHeader;
route.componentRegistry.CalendarNav = CalendarNav;
route.componentRegistry.Home = Home;
route.componentRegistry.Page = Page;
route.componentRegistry.PageHeader = PageHeader;
route.componentRegistry.PageNav = PageNav;

await route.initialize();

const app = mount(App, {
    target: document.getElementById('app')!,
    props: undefined
});

export default app;