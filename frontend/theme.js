document.documentElement.dataset.theme = sessionStorage.theme || 'dark';

window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (evt) => {
    sessionStorage.theme = document.documentElement.dataset.theme = evt.matches ? 'light' : 'dark';
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('switch-theme').addEventListener('click', () => {
        const dataset = document.documentElement.dataset;
        sessionStorage.theme = dataset.theme = dataset.theme == 'dark' ? 'light' : 'dark';
    });
});
